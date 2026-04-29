import { Module } from '@nestjs/common';
import { IncomeSourcesService } from './income-sources.service';
import { IncomeSourcesController } from './income-sources.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomeSource } from './entities/income-source.entity';

@Module({
  imports:[TypeOrmModule.forFeature([IncomeSource]),],
  controllers: [IncomeSourcesController],
  providers: [IncomeSourcesService],
})
export class IncomeSourcesModule {}
