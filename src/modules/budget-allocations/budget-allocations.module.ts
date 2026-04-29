import { Module } from '@nestjs/common';
import { BudgetAllocationsService } from './budget-allocations.service';
import { BudgetAllocationsController } from './budget-allocations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetAllocation } from './entities/budget-allocation.entity';

@Module({
 imports:[TypeOrmModule.forFeature([BudgetAllocation])],
  controllers: [BudgetAllocationsController],
  providers: [BudgetAllocationsService],
})
export class BudgetAllocationsModule {}
