import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomesService } from './incomes.service';
import { IncomesController } from './incomes.controller';
import { Income } from './entities/income.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { IncomeSource } from '../income-sources/entities/income-source.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Income, Budget, IncomeSource]),  JwtModule.register({})],
  controllers: [IncomesController],
  providers: [IncomesService],
})
export class IncomesModule {}
