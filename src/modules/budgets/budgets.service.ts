import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { BudgetAllocation } from '../budget-allocations/entities/budget-allocation.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateBudgetDto } from './dto/budget.dto';

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
}
