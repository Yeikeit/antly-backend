import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetAutomationService } from './budget-automation.service';
import { BudgetAutomationController } from './budget-automation.controller';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { BudgetAllocation } from '../budget-allocations/entities/budget-allocation.entity';
import { Income } from '../incomes/entities/income.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreferences, Budget, BudgetAllocation, Income]), AuthModule],
  controllers: [BudgetAutomationController],
  providers: [BudgetAutomationService],
  exports: [BudgetAutomationService],
})
export class BudgetAutomationModule {}
