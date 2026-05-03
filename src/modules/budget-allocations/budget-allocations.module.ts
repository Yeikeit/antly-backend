import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetAllocationsService } from './budget-allocations.service';
import { BudgetAllocationsController } from './budget-allocations.controller';
import { BudgetAllocation } from './entities/budget-allocation.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Category } from '../categories/entities/category.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([BudgetAllocation, Budget, Category]), JwtModule.register({})],
  controllers: [BudgetAllocationsController],
  providers: [BudgetAllocationsService],
})
export class BudgetAllocationsModule {}
