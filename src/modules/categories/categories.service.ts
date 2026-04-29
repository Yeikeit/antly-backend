import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoriesService {
  create() {
    return 'This action adds a new category';
  }

  findAll() {
    return `This action returns all categories`;
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  update() {
    return `This action updates a category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
