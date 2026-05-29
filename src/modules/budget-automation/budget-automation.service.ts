import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { BudgetAllocation } from '../budget-allocations/entities/budget-allocation.entity';
import { Income } from '../incomes/entities/income.entity';

@Injectable()
export class BudgetAutomationService {
  private readonly logger = new Logger(BudgetAutomationService.name);

  constructor(
    @InjectRepository(UserPreferences)
    private readonly preferencesRepo: Repository<UserPreferences>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(Income)
    private readonly incomeRepo: Repository<Income>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Runs at 00:01 on the 1st of every month.
   * Closes the previous month's active budget and creates the new month's
   * budget (copying income sources and allocations) for all users with
   * budget automation enabled.
   */
  @Cron('1 0 1 * *', { name: 'budget-monthly-rollover' })
  async handleMonthlyRollover(): Promise<{ processed: number; errors: number }> {
    // Use UTC date to avoid timezone shifts when cron fires at 00:01 local time
    return this.runRollover(new Date(new Date().toISOString().slice(0, 10)));
  }

  /**
   * Executes the full rollover logic for a given reference date.
   * The "new" month is derived from the reference date; the "previous" month
   * is calculated automatically.
   * Can be called from the cron handler or a manual trigger endpoint.
   */
  async runRollover(referenceDate: Date): Promise<{ processed: number; errors: number }> {
    const newYear = referenceDate.getUTCFullYear();
    const newMonth = referenceDate.getUTCMonth() + 1; // 1-12

    let prevYear = newYear;
    let prevMonth = newMonth - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = newYear - 1;
    }

    this.logger.log(
      `Budget rollover: closing ${prevYear}-${String(prevMonth).padStart(2, '0')}, ` +
        `creating ${newYear}-${String(newMonth).padStart(2, '0')}`,
    );

    // Find users who explicitly opted OUT — everyone else gets automated by default
    const optedOut = await this.preferencesRepo.find({
      where: { budgetAutomation: false },
    });
    const optedOutIds = new Set(optedOut.map((p) => p.userId));

    // Find all active budgets from the previous month
    const activeBudgets = await this.budgetRepo.find({
      where: { year: prevYear, month: prevMonth, status: 'ACTIVE' },
    });

    const eligible = activeBudgets.filter((b) => !optedOutIds.has(b.userId));

    this.logger.log(
      `Found ${activeBudgets.length} active budgets, ${eligible.length} eligible after opt-out filter`,
    );

    let processed = 0;
    let errors = 0;

    for (const budget of eligible) {
      try {
        await this.rolloverForUser(budget.userId, prevYear, prevMonth, newYear, newMonth);
        processed++;
      } catch (err) {
        errors++;
        this.logger.error(
          `Rollover failed for user ${budget.userId}: ${(err as Error).message}`,
          (err as Error).stack,
        );
      }
    }

    return { processed, errors };
  }

  async rolloverForUser(
    userId: string,
    prevYear: number,
    prevMonth: number,
    newYear: number,
    newMonth: number,
  ): Promise<void> {
    const prevBudget = await this.budgetRepo.findOne({
      where: { userId, year: prevYear, month: prevMonth, status: 'ACTIVE' },
      relations: ['allocations'],
    });

    if (!prevBudget) {
      this.logger.debug(
        `User ${userId}: no active budget for ${prevYear}-${String(prevMonth).padStart(2, '0')}, skipping`,
      );
      return;
    }

    const existingNewBudget = await this.budgetRepo.findOne({
      where: { userId, year: newYear, month: newMonth },
    });

    if (existingNewBudget) {
      this.logger.debug(
        `User ${userId}: budget for ${newYear}-${String(newMonth).padStart(2, '0')} already exists, skipping`,
      );
      return;
    }

    const prevIncomes = await this.incomeRepo.find({ where: { budgetId: prevBudget.id } });

    await this.dataSource.transaction(async (manager) => {
      // Close previous month's budget
      prevBudget.status = 'CLOSED';
      await manager.save(Budget, prevBudget);

      // Create new budget with same totals (totalSpent resets implicitly — no transactions)
      const newBudget = manager.create(Budget, {
        userId,
        year: newYear,
        month: newMonth,
        notes: null,
        status: 'ACTIVE',
        totalIncomeAmount: prevBudget.totalIncomeAmount,
        totalAllocatedAmount: prevBudget.totalAllocatedAmount,
      });
      await manager.save(Budget, newBudget);

      // Copy allocations (categories + amounts, no transactions)
      if (prevBudget.allocations?.length) {
        const newAllocations = prevBudget.allocations.map((a) =>
          manager.create(BudgetAllocation, {
            budgetId: newBudget.id,
            categoryId: a.categoryId,
            allocatedAmount: a.allocatedAmount,
          }),
        );
        await manager.save(BudgetAllocation, newAllocations);
      }

      // Copy income sources with 1st of new month as received date
      const receivedDate = `${newYear}-${String(newMonth).padStart(2, '0')}-01`;
      for (const income of prevIncomes) {
        await manager.save(
          manager.create(Income, {
            userId,
            incomeSourceId: income.incomeSourceId,
            budgetId: newBudget.id,
            amount: income.amount,
            receivedDate,
          }),
        );
      }

      this.logger.log(
        `User ${userId}: rolled over to ${newYear}-${String(newMonth).padStart(2, '0')} ` +
          `(${prevBudget.allocations?.length ?? 0} allocations, ${prevIncomes.length} income sources)`,
      );
    });
  }
}
