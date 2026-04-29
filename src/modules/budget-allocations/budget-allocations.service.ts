import { Injectable } from '@nestjs/common';
import { CreateBudgetAllocationDto } from './dto/create-budget-allocation.dto';
import { UpdateBudgetAllocationDto } from './dto/update-budget-allocation.dto';

@Injectable()
export class BudgetAllocationsService {
  create(createBudgetAllocationDto: CreateBudgetAllocationDto) {
    return 'This action adds a new budgetAllocation';
  }

  findAll() {
    return `This action returns all budgetAllocations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} budgetAllocation`;
  }

  update(id: number, updateBudgetAllocationDto: UpdateBudgetAllocationDto) {
    return `This action updates a #${id} budgetAllocation`;
  }

  remove(id: number) {
    return `This action removes a #${id} budgetAllocation`;
  }
}
