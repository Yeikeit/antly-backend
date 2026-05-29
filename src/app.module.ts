import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/users/entities/user.entity';
import { UserPreferences } from './modules/users/entities/user-preferences.entity';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { Budget } from './modules/budgets/entities/budget.entity';
import { BudgetChangeLog } from './modules/budgets/entities/budget-change-log.entity';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { BudgetAllocation } from './modules/budget-allocations/entities/budget-allocation.entity';
import { BudgetAllocationsModule } from './modules/budget-allocations/budget-allocations.module';
import { Category } from './modules/categories/entities/category.entity';
import { CategoriesModule } from './modules/categories/categories.module';
import { IncomeSource } from './modules/income-sources/entities/income-source.entity';
import { IncomeSourcesModule } from './modules/income-sources/income-sources.module';
import { Income } from './modules/incomes/entities/income.entity';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { IncomesModule } from './modules/incomes/incomes.module';
import { Transaction } from './modules/transactions/entities/transaction.entity';
import { UsersModule } from './modules/users/users.module';
import { BudgetAutomationModule } from './modules/budget-automation/budget-automation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        entities: [User, UserPreferences, RefreshToken, Budget, BudgetChangeLog, BudgetAllocation, Category, IncomeSource, Income, Transaction],
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
        connectTimeoutMS: 5000,
        extra: {
          max: 5,
          min: 1,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),
    AuthModule,
    BudgetsModule,
    BudgetAllocationsModule,
    CategoriesModule,
    IncomeSourcesModule,
    IncomesModule,
    TransactionsModule,
    UsersModule,
    BudgetAutomationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
