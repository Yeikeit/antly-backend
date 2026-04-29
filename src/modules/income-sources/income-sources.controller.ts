import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IncomeSourcesService } from './income-sources.service';

@Controller('income-sources')
export class IncomeSourcesController {
  constructor(private readonly incomeSourcesService: IncomeSourcesService) {}

  @Post()
  create() {
    return this.incomeSourcesService.create();
  }

  @Get()
  findAll() {
    return this.incomeSourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incomeSourcesService.findOne(+id);
  }

  @Patch(':id')
  update() {
    return this.incomeSourcesService.update();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incomeSourcesService.remove(+id);
  }
}
