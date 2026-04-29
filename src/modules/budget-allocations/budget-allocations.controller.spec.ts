import { Test, TestingModule } from '@nestjs/testing';
import { BudgetAllocationsController } from './budget-allocations.controller';
import { BudgetAllocationsService } from './budget-allocations.service';

describe('BudgetAllocationsController', () => {
  let controller: BudgetAllocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetAllocationsController],
      providers: [BudgetAllocationsService],
    }).compile();

    controller = module.get<BudgetAllocationsController>(BudgetAllocationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
