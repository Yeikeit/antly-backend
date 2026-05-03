import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    budgetId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.status === 'CLOSED') {
      throw new BadRequestException('No se puede registrar una transacción en un presupuesto cerrado');
    }

    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId, userId, isActive: true },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    if (category.type !== dto.type) {
      throw new BadRequestException(
        `El tipo de transacción "${dto.type}" no coincide con el tipo de la categoría "${category.type}"`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const transaction = manager.create(Transaction, {
        userId,
        budgetId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount,
        transactionDate: dto.transactionDate,
        description: dto.description ?? null,
      });
      await manager.save(transaction);

      return manager.findOneOrFail(Transaction, {
        where: { id: transaction.id },
        relations: ['category'],
      });
    });
  }

  async findAll(userId: string, budgetId: string): Promise<Transaction[]> {
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');

    return this.transactionRepo.find({
      where: { budgetId, userId },
      relations: ['category'],
      order: { transactionDate: 'DESC' },
    });
  }

  async findOne(userId: string, budgetId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id, budgetId, userId },
      relations: ['category'],
    });
    if (!transaction) throw new NotFoundException('Transacción no encontrada');
    return transaction;
  }

  async update(
    userId: string,
    budgetId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.status === 'CLOSED') {
      throw new BadRequestException('No se puede modificar una transacción en un presupuesto cerrado');
    }

    const transaction = await this.transactionRepo.findOne({
      where: { id, budgetId, userId },
      relations: ['category'],
    });
    if (!transaction) throw new NotFoundException('Transacción no encontrada');

    if (dto.categoryId && dto.categoryId !== transaction.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId, userId, isActive: true },
      });
      if (!category) throw new NotFoundException('Categoría no encontrada');

      const effectiveType = dto.type ?? transaction.type;
      if (category.type !== effectiveType) {
        throw new BadRequestException(
          `El tipo "${effectiveType}" no coincide con el tipo de la categoría "${category.type}"`,
        );
      }
      transaction.categoryId = dto.categoryId;
    }

    if (dto.type !== undefined) {
      const categoryId = dto.categoryId ?? transaction.categoryId;
      const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
      if (category && category.type !== dto.type) {
        throw new BadRequestException(
          `El tipo "${dto.type}" no coincide con el tipo de la categoría "${category.type}"`,
        );
      }
      transaction.type = dto.type;
    }

    if (dto.amount !== undefined) transaction.amount = dto.amount;
    if (dto.transactionDate !== undefined) transaction.transactionDate = dto.transactionDate;
    if (dto.description !== undefined) transaction.description = dto.description ?? null;

    return this.dataSource.transaction(async (manager) => {
      await manager.save(transaction);
      return manager.findOneOrFail(Transaction, {
        where: { id: transaction.id },
        relations: ['category'],
      });
    });
  }

  async remove(userId: string, budgetId: string, id: string): Promise<void> {
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.status === 'CLOSED') {
      throw new BadRequestException('No se puede eliminar una transacción de un presupuesto cerrado');
    }

    const transaction = await this.transactionRepo.findOne({
      where: { id, budgetId, userId },
    });
    if (!transaction) throw new NotFoundException('Transacción no encontrada');

    await this.transactionRepo.remove(transaction);
  }
}
