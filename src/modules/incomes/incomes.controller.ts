import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IncomesService } from './incomes.service';


@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  create() {
    return this.incomesService.create();
  }

  @Get()
  findAll() {
    return this.incomesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incomesService.findOne(+id);
  }

  @Patch(':id')
  update() {
    return this.incomesService.update();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incomesService.remove(+id);
  }
}
