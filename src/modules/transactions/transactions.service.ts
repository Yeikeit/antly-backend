import { Injectable } from '@nestjs/common';


@Injectable()
export class TransactionsService {
  create() {
    return 'This action adds a new transaction';
  }

  findAll() {
    return `This action returns all transactions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update() {
    return `This action updates a transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
