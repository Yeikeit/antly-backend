import { Module } from '@nestjs/common';
import { IncomeSourcesService } from './income-sources.service';
import { IncomeSourcesController } from './income-sources.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomeSource } from './entities/income-source.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[TypeOrmModule.forFeature([IncomeSource]), JwtModule.register({})],
  controllers: [IncomeSourcesController],
  providers: [IncomeSourcesService],
})
export class IncomeSourcesModule {}
