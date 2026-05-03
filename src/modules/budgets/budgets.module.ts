import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { Budget } from './entities/budget.entity';
import { BudgetChangeLog } from './entities/budget-change-log.entity';
import { BudgetAllocation } from '../budget-allocations/entities/budget-allocation.entity';
import { Category } from '../categories/entities/category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetChangeLog, BudgetAllocation, Category, Transaction]), JwtModule.register({}),],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
