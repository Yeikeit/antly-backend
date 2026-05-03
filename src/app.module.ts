import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/users/entities/user.entity';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { Budget } from './modules/budgets/entities/budget.entity';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: config.get<string>('DATABASE_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
        entities: [User, RefreshToken, Budget, BudgetAllocation, Category, IncomeSource, Income, Transaction, User],
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    BudgetsModule,
    BudgetAllocationsModule,
    CategoriesModule,
    IncomeSourcesModule,
    IncomesModule,
    TransactionsModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
