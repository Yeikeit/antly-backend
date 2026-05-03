import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { BudgetAllocation } from './entities/budget-allocation.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Category } from '../categories/entities/category.entity';
import { UpsertAllocationDto } from './dto/create-budget-allocation.dto';

@Injectable()
export class BudgetAllocationsService {
  constructor(
    @InjectRepository(BudgetAllocation)
    private readonly allocationRepo: Repository<BudgetAllocation>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async upsert(
    userId: string,
    budgetId: string,
    dto: UpsertAllocationDto,
  ): Promise<BudgetAllocation> {
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.status === 'CLOSED') {
      throw new BadRequestException('No se puede modificar un presupuesto cerrado');
    }

    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId, userId, isActive: true },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    return this.dataSource.transaction(async (manager) => {
      let allocation = await manager.findOne(BudgetAllocation, {
        where: { budgetId, categoryId: dto.categoryId },
      });

      if (allocation) {
        allocation.allocatedAmount = dto.allocatedAmount;
      } else {
        allocation = manager.create(BudgetAllocation, {
          budgetId,
          categoryId: dto.categoryId,
          allocatedAmount: dto.allocatedAmount,
        });
      }
      await manager.save(allocation);

      await this.recalculateTotalAllocated(manager, budgetId);

      return manager.findOneOrFail(BudgetAllocation, {
        where: { id: allocation.id },
        relations: ['category'],
      });
    });
  }

  async remove(
    userId: string,
    budgetId: string,
    categoryId: string,
  ): Promise<void> {
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.status === 'CLOSED') {
      throw new BadRequestException('No se puede modificar un presupuesto cerrado');
    }

    const allocation = await this.allocationRepo.findOne({
      where: { budgetId, categoryId },
    });
    if (!allocation) throw new NotFoundException('Allocation no encontrada');

    await this.dataSource.transaction(async (manager) => {
      await manager.remove(allocation);
      await this.recalculateTotalAllocated(manager, budgetId);
    });
  }

  private async recalculateTotalAllocated(
    manager: EntityManager,
    budgetId: string,
  ): Promise<void> {
    const result = await manager
      .createQueryBuilder(BudgetAllocation, 'a')
      .select('COALESCE(SUM(a.allocated_amount), 0)', 'sum')
      .where('a.budget_id = :budgetId', { budgetId })
      .getRawOne<{ sum: string }>();

    await manager.update(Budget, { id: budgetId }, {
      totalAllocatedAmount: parseFloat(result?.sum ?? '0'),
    });
  }
}
