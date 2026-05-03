import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { Budget } from './entities/budget.entity';
import { BudgetAllocation } from '../budget-allocations/entities/budget-allocation.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetAllocation, Category])],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
