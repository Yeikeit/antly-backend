import { Injectable } from '@nestjs/common';


@Injectable()
export class IncomesService {
  create() {
    return 'This action adds a new income';
  }

  findAll() {
    return `This action returns all incomes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} income`;
  }

  update() {
    return `This action updates a income`;
  }

  remove(id: number) {
    return `This action removes a #${id} income`;
  }
}
