import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncomeSource } from './entities/income-source.entity';
import { CreateIncomeSourceDto, UpdateIncomeSourceDto } from './dto/income-source.dto';

@Injectable()
export class IncomeSourcesService {
  constructor(
    @InjectRepository(IncomeSource)
    private readonly repo: Repository<IncomeSource>,
  ) {}

  async create(userId: string, dto: CreateIncomeSourceDto): Promise<IncomeSource> {
    const exists = await this.repo.findOne({ where: { userId, name: dto.name } });
    if (exists) {
      throw new ConflictException(`Ya existe una fuente de ingreso con el nombre "${dto.name}"`);
    }

    return this.repo.save(this.repo.create({ userId, name: dto.name }));
  }

  async findAll(userId: string): Promise<IncomeSource[]> {
    return this.repo.find({
      where: { userId },
      order: { isActive: 'DESC', name: 'ASC' },
    });
  }

  async findOne(userId: string, id: string): Promise<IncomeSource> {
    const source = await this.repo.findOne({ where: { id, userId } });
    if (!source) throw new NotFoundException('Fuente de ingreso no encontrada');
    return source;
  }

  async update(userId: string, id: string, dto: UpdateIncomeSourceDto): Promise<IncomeSource> {
    const source = await this.findOne(userId, id);

    if (dto.name && dto.name !== source.name) {
      const exists = await this.repo.findOne({ where: { userId, name: dto.name } });
      if (exists) {
        throw new ConflictException(`Ya existe una fuente de ingreso con el nombre "${dto.name}"`);
      }
      source.name = dto.name;
    }

    if (dto.isActive !== undefined) {
      source.isActive = dto.isActive;
    }

    return this.repo.save(source);
  }

  async remove(userId: string, id: string): Promise<void> {
    const source = await this.findOne(userId, id);
    try {
      await this.repo.remove(source);
    } catch (err: any) {
      if (err?.code === '23503') {
        throw new BadRequestException(
          'No se puede eliminar una fuente de ingreso que tiene ingresos registrados',
        );
      }
      throw err;
    }
  }
}
