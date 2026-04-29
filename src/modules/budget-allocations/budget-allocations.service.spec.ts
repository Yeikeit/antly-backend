import { Test, TestingModule } from '@nestjs/testing';
import { BudgetAllocationsService } from './budget-allocations.service';

describe('BudgetAllocationsService', () => {
  let service: BudgetAllocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BudgetAllocationsService],
    }).compile();

    service = module.get<BudgetAllocationsService>(BudgetAllocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
