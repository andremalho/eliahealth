import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BiologicalFather } from './biological-father.entity.js';
import { CreateBiologicalFatherDto } from './dto/create-biological-father.dto.js';
import { UpdateBiologicalFatherDto } from './dto/update-biological-father.dto.js';

@Injectable()
export class BiologicalFatherService {
  constructor(@InjectRepository(BiologicalFather) private readonly repo: Repository<BiologicalFather>) {}

  async create(pregnancyId: string, dto: CreateBiologicalFatherDto): Promise<BiologicalFather> {
    const father = this.repo.create({ ...dto, pregnancyId });
    return this.repo.save(father);
  }

  async findOne(pregnancyId: string): Promise<BiologicalFather> {
    const f = await this.repo.findOneBy({ pregnancyId });
    if (!f) throw new NotFoundException(`Dados do pai biologico nao encontrados para gestacao ${pregnancyId}`);
    return f;
  }

  async update(pregnancyId: string, dto: UpdateBiologicalFatherDto): Promise<BiologicalFather> {
    const f = await this.findOne(pregnancyId);
    Object.assign(f, dto);
    return this.repo.save(f);
  }
}
