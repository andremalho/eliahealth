import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PregnancyFile } from './pregnancy-file.entity.js';
import { CreateFileDto } from './dto/create-file.dto.js';
import { UpdateFileDto } from './dto/update-file.dto.js';

@Injectable()
export class FilesService {
  constructor(@InjectRepository(PregnancyFile) private readonly repo: Repository<PregnancyFile>) {}

  async create(pregnancyId: string, uploadedBy: string, dto: CreateFileDto): Promise<PregnancyFile> {
    const file = this.repo.create({ ...dto, pregnancyId, uploadedBy });
    return this.repo.save(file);
  }

  async findAll(pregnancyId: string, page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      where: { pregnancyId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, dto: UpdateFileDto): Promise<PregnancyFile> {
    const file = await this.repo.findOneBy({ id });
    if (!file) throw new NotFoundException(`Arquivo ${id} nao encontrado`);
    Object.assign(file, dto);
    return this.repo.save(file);
  }

  async remove(id: string): Promise<void> {
    const file = await this.repo.findOneBy({ id });
    if (!file) throw new NotFoundException(`Arquivo ${id} nao encontrado`);
    await this.repo.remove(file);
  }
}
