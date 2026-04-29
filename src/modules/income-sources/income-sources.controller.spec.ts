import { Test, TestingModule } from '@nestjs/testing';
import { IncomeSourcesController } from './income-sources.controller';
import { IncomeSourcesService } from './income-sources.service';

describe('IncomeSourcesController', () => {
  let controller: IncomeSourcesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomeSourcesController],
      providers: [IncomeSourcesService],
    }).compile();

    controller = module.get<IncomeSourcesController>(IncomeSourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
