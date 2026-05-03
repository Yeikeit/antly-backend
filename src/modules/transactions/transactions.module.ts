import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Category } from '../categories/entities/category.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Budget, Category]), JwtModule.register({})],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
