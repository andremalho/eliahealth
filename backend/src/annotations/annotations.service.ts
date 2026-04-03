import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Annotation } from './annotation.entity.js';
import { CreateAnnotationDto } from './dto/create-annotation.dto.js';

@Injectable()
export class AnnotationsService {
  constructor(@InjectRepository(Annotation) private readonly repo: Repository<Annotation>) {}

  async create(pregnancyId: string, authorId: string, dto: CreateAnnotationDto): Promise<Annotation> {
    const annotation = this.repo.create({ ...dto, pregnancyId, authorId });
    return this.repo.save(annotation);
  }

  async findAll(pregnancyId: string): Promise<Annotation[]> {
    return this.repo.find({
      where: { pregnancyId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const annotation = await this.repo.findOneBy({ id });
    if (!annotation) throw new NotFoundException(`Anotacao ${id} nao encontrada`);
    await this.repo.remove(annotation);
  }
}
