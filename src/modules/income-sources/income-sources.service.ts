import { Injectable } from '@nestjs/common';


@Injectable()
export class IncomeSourcesService {
  create() {
    return 'This action adds a new incomeSource';
  }

  findAll() {
    return `This action returns all incomeSources`;
  }

  findOne(id: number) {
    return `This action returns a #${id} incomeSource`;
  }

  update() {
    return `This action updates a incomeSource`;
  }

  remove(id: number) {
    return `This action removes a #${id} incomeSource`;
  }
}
