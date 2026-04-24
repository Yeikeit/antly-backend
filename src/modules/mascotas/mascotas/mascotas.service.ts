import { Injectable } from '@nestjs/common';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Mascota } from './entities/mascota.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MascotasService {
  constructor(  @InjectRepository(Mascota)
  private readonly mascotaRepository: Repository<Mascota>
) {}

  async create(createMascotaDto: CreateMascotaDto) {
    var mascotaNueva: Mascota = new Mascota
    mascotaNueva.name = createMascotaDto.name
    const nm = this.mascotaRepository.create(mascotaNueva);
    return await this.mascotaRepository.save(nm);
  }

  async findAll() {
    return await this.mascotaRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} mascota`;
  }

  update(id: number, updateMascotaDto: any) {
    return `This action updates a #${id} mascota`;
  }

  remove(id: number) {
    return `This action removes a #${id} mascota`;
  }
}
