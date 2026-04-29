import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BudgetAllocationsService } from './budget-allocations.service';
import { CreateBudgetAllocationDto } from './dto/create-budget-allocation.dto';
import { UpdateBudgetAllocationDto } from './dto/update-budget-allocation.dto';

@Controller('budget-allocations')
export class BudgetAllocationsController {
  constructor(private readonly budgetAllocationsService: BudgetAllocationsService) {}

  @Post()
  create(@Body() createBudgetAllocationDto: CreateBudgetAllocationDto) {
    return this.budgetAllocationsService.create(createBudgetAllocationDto);
  }

  @Get()
  findAll() {
    return this.budgetAllocationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgetAllocationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBudgetAllocationDto: UpdateBudgetAllocationDto) {
    return this.budgetAllocationsService.update(+id, updateBudgetAllocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.budgetAllocationsService.remove(+id);
  }
}
