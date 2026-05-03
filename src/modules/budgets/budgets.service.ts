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
} from './dto/budget.dto';

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

    // Allocations con categoría y padre en una sola query
    const allocations = await this.dataSource
      .createQueryBuilder(BudgetAllocation, 'a')
      .innerJoin('a.category', 'cat')
      .leftJoin('cat.parent', 'parent')
      .addSelect(['cat.id', 'cat.name', 'cat.type', 'cat.parentId', 'parent.id', 'parent.name'])
      .where('a.budget_id = :id', { id })
      .getMany();

    // Gastos reales agrupados por categoría en una sola query
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
