import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { BudgetChangeLog } from './entities/budget-change-log.entity';
import { BudgetAllocation } from '../budget-allocations/entities/budget-allocation.entity';
import { Category } from '../categories/entities/category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import {
  CreateBudgetDto,
  CloseBudgetDto,
  BudgetSummary,
  AllocationSummary,
  CreateBudgetWizardDto,
} from './dto/budget.dto';
import { Income } from '../incomes/entities/income.entity';
import { IncomeSource } from '../income-sources/entities/income-source.entity';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<Budget> {
    const exists = await this.budgetRepo.findOne({
      where: { userId, year: dto.year, month: dto.month },
    });
    if (exists) {
      throw new ConflictException(
        `Ya existe un presupuesto para ${dto.year}-${String(dto.month).padStart(2, '0')}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const budget = manager.create(Budget, {
        userId,
        year: dto.year,
        month: dto.month,
        notes: dto.notes ?? null,
        status: 'ACTIVE',
        totalIncomeAmount: 0,
        totalAllocatedAmount: 0,
      });
      await manager.save(budget);

      if (dto.useTemplate) {
        const templateCategories = await this.categoryRepo.find({
          where: { userId, sourceType: 'DEFAULT', isActive: true },
          order: { level: 'ASC', sortOrder: 'ASC' },
        });

        const subcategories = templateCategories.filter((c) => c.level === 2);

        if (subcategories.length > 0) {
          const allocations = subcategories.map((cat) =>
            manager.create(BudgetAllocation, {
              budgetId: budget.id,
              categoryId: cat.id,
              allocatedAmount: 0,
            }),
          );
          await manager.save(BudgetAllocation, allocations);
        }
      }

      return manager.findOneOrFail(Budget, {
        where: { id: budget.id },
        relations: ['allocations', 'allocations.category', 'allocations.category.parent'],
      });
    });
  }

  async createWizard(userId: string, dto: CreateBudgetWizardDto): Promise<Budget> {
    const exists = await this.budgetRepo.findOne({
      where: { userId, year: dto.year, month: dto.month },
    });
    if (exists) {
      throw new ConflictException(
        `Ya existe un presupuesto para ${dto.year}-${String(dto.month).padStart(2, '0')}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
  
      const budget = manager.create(Budget, {
        userId,
        year: dto.year,
        month: dto.month,
        notes: dto.notes ?? null,
        status: 'ACTIVE',
        totalIncomeAmount: 0,
        totalAllocatedAmount: 0,
      });
      await manager.save(budget);

      const receivedDate = `${dto.year}-${String(dto.month).padStart(2, '0')}-01`;
      let totalIncome = 0;

      for (const src of dto.incomeSources) {
        let incomeSource = await manager.findOne(IncomeSource, {
          where: { userId, name: src.name },
        });
        if (!incomeSource) {
          incomeSource = await manager.save(
            manager.create(IncomeSource, { userId, name: src.name, isActive: true }),
          );
        }

        await manager.save(
          manager.create(Income, {
            userId,
            incomeSourceId: incomeSource.id,
            budgetId: budget.id,
            amount: src.amount,
            receivedDate,
          }),
        );
        totalIncome += src.amount;
      }


      let totalAllocated = 0;

      for (const cat of dto.categories) {
        let parentId: string;
        if (cat.id) {
          parentId = cat.id;
        } else {
          const parent = await manager.save(
            manager.create(Category, {
              userId,
              name: cat.name,
              level: 1,
              type: cat.type ?? 'EXPENSE',
              sourceType: 'CUSTOM',
              isActive: true,
            }),
          );
          parentId = parent.id;
        }

        for (const sub of cat.subcategories) {
          let subcategoryId: string;
          if (sub.id) {
            subcategoryId = sub.id;
          } else {
            const subcategory = await manager.save(
              manager.create(Category, {
                userId,
                name: sub.name,
                parentId,
                level: 2,
                type: cat.type ?? 'EXPENSE',
                sourceType: 'CUSTOM',
                isActive: true,
              }),
            );
            subcategoryId = subcategory.id;
          }

          await manager.save(
            manager.create(BudgetAllocation, {
              budgetId: budget.id,
              categoryId: subcategoryId,
              allocatedAmount: sub.budget,
            }),
          );
          totalAllocated += sub.budget;
        }
      }


      budget.totalIncomeAmount = totalIncome;
      budget.totalAllocatedAmount = totalAllocated;
      await manager.save(budget);

      return manager.findOneOrFail(Budget, {
        where: { id: budget.id },
        relations: ['allocations', 'allocations.category', 'allocations.category.parent'],
      });
    });
  }

  async findCurrent(userId: string): Promise<Budget | null> {
    return this.budgetRepo.findOne({
      where: { userId, status: 'ACTIVE' },
      order: { year: 'DESC', month: 'DESC' },
      relations: ['allocations', 'allocations.category', 'allocations.category.parent'],
    });
  }

  async findAll(userId: string): Promise<Budget[]> {
    return this.budgetRepo.find({
      where: { userId },
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Budget> {
    const budget = await this.budgetRepo.findOne({
      where: { id, userId },
      relations: ['allocations', 'allocations.category', 'allocations.category.parent'],
    });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    return budget;
  }

  async close(userId: string, id: string, dto: CloseBudgetDto): Promise<Budget> {
    const budget = await this.budgetRepo.findOne({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.status === 'CLOSED') {
      throw new BadRequestException('El presupuesto ya está cerrado');
    }

    return this.dataSource.transaction(async (manager) => {
      const oldStatus = budget.status;
      budget.status = 'CLOSED';
      await manager.save(budget);

      await manager.save(
        manager.create(BudgetChangeLog, {
          budgetId: id,
          changedByUserId: userId,
          changeType: 'STATUS_CHANGE',
          reason: dto.reason,
          oldValue: oldStatus,
          newValue: 'CLOSED',
        }),
      );

      return budget;
    });
  }

  async getSummary(userId: string, id: string): Promise<BudgetSummary> {
    const budget = await this.budgetRepo.findOne({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');

    const allocations = await this.dataSource
      .createQueryBuilder(BudgetAllocation, 'a')
      .innerJoin('a.category', 'cat')
      .leftJoin('cat.parent', 'parent')
      .addSelect(['cat.id', 'cat.name', 'cat.type', 'cat.parentId', 'parent.id', 'parent.name'])
      .where('a.budget_id = :id', { id })
      .getMany();

    const spentRows = await this.dataSource
      .createQueryBuilder(Transaction, 't')
      .select('t.category_id', 'categoryId')
      .addSelect('SUM(t.amount)', 'spent')
      .where('t.budget_id = :id', { id })
      .groupBy('t.category_id')
      .getRawMany<{ categoryId: string; spent: string }>();

    const spentMap = new Map(spentRows.map((r) => [r.categoryId, parseFloat(r.spent)]));

    const allocationSummaries: AllocationSummary[] = allocations.map((a) => {
      const allocated = Number(a.allocatedAmount);
      const spent = spentMap.get(a.categoryId) ?? 0;
      const remaining = allocated - spent;
      const executionPct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

      return {
        categoryId: a.categoryId,
        categoryName: a.category.name,
        parentId: a.category.parentId,
        parentName: a.category.parent?.name ?? null,
        type: a.category.type,
        allocated,
        spent,
        remaining,
        executionPct,
      };
    });

    const totalSpent = allocationSummaries.reduce((sum, a) => sum + a.spent, 0);

    return {
      budgetId: budget.id,
      year: budget.year,
      month: budget.month,
      status: budget.status,
      totalIncomeAmount: Number(budget.totalIncomeAmount),
      totalAllocatedAmount: Number(budget.totalAllocatedAmount),
      totalSpent,
      totalRemaining: Number(budget.totalAllocatedAmount) - totalSpent,
      allocations: allocationSummaries,
    };
  }
}
