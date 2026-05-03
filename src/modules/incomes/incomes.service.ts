import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Income } from './entities/income.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { IncomeSource } from '../income-sources/entities/income-source.entity';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepo: Repository<Income>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(IncomeSource)
    private readonly incomeSourceRepo: Repository<IncomeSource>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, budgetId: string, dto: CreateIncomeDto): Promise<Income> {
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.status === 'CLOSED') {
      throw new BadRequestException('No se puede registrar un ingreso en un presupuesto cerrado');
    }

    const source = await this.incomeSourceRepo.findOne({
      where: { id: dto.incomeSourceId, userId, isActive: true },
    });
    if (!source) throw new NotFoundException('Fuente de ingreso no encontrada');

    return this.dataSource.transaction(async (manager) => {
      const income = manager.create(Income, {
        userId,
        budgetId,
        incomeSourceId: dto.incomeSourceId,
        amount: dto.amount,
        receivedDate: dto.receivedDate,
        description: dto.description ?? null,
      });
      await manager.save(income);
      await this.recalculateTotalIncome(manager, budgetId);

      return manager.findOneOrFail(Income, {
        where: { id: income.id },
        relations: ['incomeSource'],
      });
    });
  }

  async findAll(userId: string, budgetId: string): Promise<Income[]> {
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');

    return this.incomeRepo.find({
      where: { budgetId, userId },
      relations: ['incomeSource'],
      order: { receivedDate: 'DESC' },
    });
  }

  async findOne(userId: string, budgetId: string, id: string): Promise<Income> {
    const income = await this.incomeRepo.findOne({
      where: { id, budgetId, userId },
      relations: ['incomeSource'],
    });
    if (!income) throw new NotFoundException('Ingreso no encontrado');
    return income;
  }

  async update(
    userId: string,
    budgetId: string,
    id: string,
    dto: UpdateIncomeDto,
  ): Promise<Income> {
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.status === 'CLOSED') {
      throw new BadRequestException('No se puede modificar un ingreso en un presupuesto cerrado');
    }

    const income = await this.incomeRepo.findOne({ where: { id, budgetId, userId } });
    if (!income) throw new NotFoundException('Ingreso no encontrado');

    if (dto.incomeSourceId && dto.incomeSourceId !== income.incomeSourceId) {
      const source = await this.incomeSourceRepo.findOne({
        where: { id: dto.incomeSourceId, userId, isActive: true },
      });
      if (!source) throw new NotFoundException('Fuente de ingreso no encontrada');
      income.incomeSourceId = dto.incomeSourceId;
    }

    if (dto.amount !== undefined) income.amount = dto.amount;
    if (dto.receivedDate !== undefined) income.receivedDate = dto.receivedDate;
    if (dto.description !== undefined) income.description = dto.description ?? null;

    return this.dataSource.transaction(async (manager) => {
      await manager.save(income);
      await this.recalculateTotalIncome(manager, budgetId);

      return manager.findOneOrFail(Income, {
        where: { id: income.id },
        relations: ['incomeSource'],
      });
    });
  }

  async remove(userId: string, budgetId: string, id: string): Promise<void> {
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.status === 'CLOSED') {
      throw new BadRequestException('No se puede eliminar un ingreso de un presupuesto cerrado');
    }

    const income = await this.incomeRepo.findOne({ where: { id, budgetId, userId } });
    if (!income) throw new NotFoundException('Ingreso no encontrado');

    await this.dataSource.transaction(async (manager) => {
      await manager.remove(income);
      await this.recalculateTotalIncome(manager, budgetId);
    });
  }

  private async recalculateTotalIncome(
    manager: EntityManager,
    budgetId: string,
  ): Promise<void> {
    const result = await manager
      .createQueryBuilder(Income, 'i')
      .select('COALESCE(SUM(i.amount), 0)', 'sum')
      .where('i.budget_id = :budgetId', { budgetId })
      .getRawOne<{ sum: string }>();

    await manager.update(Budget, { id: budgetId }, {
      totalIncomeAmount: parseFloat(result?.sum ?? '0'),
    });
  }
}
