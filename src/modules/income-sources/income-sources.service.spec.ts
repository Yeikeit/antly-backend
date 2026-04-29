import { Test, TestingModule } from '@nestjs/testing';
import { IncomeSourcesService } from './income-sources.service';

describe('IncomeSourcesService', () => {
  let service: IncomeSourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncomeSourcesService],
    }).compile();

    service = module.get<IncomeSourcesService>(IncomeSourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
