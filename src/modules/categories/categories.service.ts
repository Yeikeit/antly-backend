import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryTreeDto,
} from './dto/category.dto';

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
        sourceType: parent.sourceType,
        sortOrder: parent.sortOrder,
        subcategories: activeChildren
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((child): CategoryResponseDto => ({
            id: child.id,
            name: child.name,
            type: child.type,
            sourceType: child.sourceType,
            sortOrder: child.sortOrder,
          })),
      };
    });
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const level = dto.parentId ? 2 : 1;

    if (dto.parentId) {
      const parent = await this.categoryRepo.findOne({
        where: { id: dto.parentId, userId },
      });
      if (!parent) throw new NotFoundException('Categoría padre no encontrada');
      if (parent.level !== 1) {
        throw new BadRequestException(
          'Solo se pueden crear subcategorías bajo una categoría de nivel 1',
        );
      }
    }

    const exists = await this.categoryRepo.findOne({
      where: {
        userId,
        parentId: dto.parentId ?? IsNull(),
        name: dto.name,
      },
    });
    if (exists) {
      throw new ConflictException(
        `Ya existe una categoría con el nombre "${dto.name}" en este nivel`,
      );
    }

    const category = this.categoryRepo.create({
      userId,
      parentId: dto.parentId ?? null,
      name: dto.name,
      type: dto.type,
      level,
      sourceType: 'CUSTOM',
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.categoryRepo.save(category);
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id, userId } });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    if (dto.name && dto.name !== category.name) {
      const exists = await this.categoryRepo.findOne({
        where: {
          userId,
          parentId: category.parentId ?? IsNull(),
          name: dto.name,
        },
      });
      if (exists) {
        throw new ConflictException(
          `Ya existe una categoría con el nombre "${dto.name}" en este nivel`,
        );
      }
      category.name = dto.name;
    }

    if (dto.isActive !== undefined) category.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;

    return this.categoryRepo.save(category);
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({
      where: { id, userId },
      relations: ['children'],
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    // Soft-delete: desactivar en lugar de borrar para preservar histórico de transacciones
    category.isActive = false;

    if (category.level === 1 && category.children.length > 0) {
      const activeChildren = category.children.filter((c) => c.isActive);
      if (activeChildren.length > 0) {
        await this.categoryRepo.save(
          activeChildren.map((c) => ({ ...c, isActive: false })),
        );
      }
    }

    await this.categoryRepo.save(category);
  }
}
