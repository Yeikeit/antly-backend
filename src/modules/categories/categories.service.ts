import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CategoryResponseDto, CategoryTreeDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAllByUser(userId: string): Promise<CategoryTreeDto[]> {
    const parents = await this.categoryRepo.find({
      where: { userId, level: 1, isActive: true },
      relations: ['children'],
      order: { sortOrder: 'ASC' },
    });

    return parents.map((parent) => {
      const activeChildren = parent.children.filter((c) => c.isActive);
      return {
        id: parent.id,
        name: parent.name,
        type: parent.type,
        sortOrder: parent.sortOrder,
        subcategories: activeChildren
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((child): CategoryResponseDto => ({
            id: child.id,
            name: child.name,
            type: child.type,
            sortOrder: child.sortOrder,
          })),
      };
    });
  }
}
