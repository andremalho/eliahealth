import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EducationalContent, ContentCategory } from './content.entity.js';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(EducationalContent) private readonly repo: Repository<EducationalContent>,
  ) {}

  async create(dto: Partial<EducationalContent>): Promise<EducationalContent> {
    return this.repo.save(this.repo.create(dto));
  }

  async findAll(category?: string, gaWeek?: number) {
    const qb = this.repo.createQueryBuilder('c')
      .where('c.isPublished = true')
      .orderBy('c.sortOrder', 'ASC')
      .addOrderBy('c.createdAt', 'DESC');
    if (category) qb.andWhere('c.category = :category', { category });
    if (gaWeek) {
      qb.andWhere('(c.gaWeekMin IS NULL OR c.gaWeekMin <= :gaWeek)', { gaWeek });
      qb.andWhere('(c.gaWeekMax IS NULL OR c.gaWeekMax >= :gaWeek)', { gaWeek });
    }
    return qb.getMany();
  }

  async findForPatient(gaWeek?: number) {
    return this.findAll(undefined, gaWeek);
  }

  async findOne(id: string): Promise<EducationalContent> {
    const c = await this.repo.findOneBy({ id });
    if (!c) throw new NotFoundException('Conteudo nao encontrado');
    return c;
  }

  async update(id: string, dto: Partial<EducationalContent>) {
    const c = await this.findOne(id);
    Object.assign(c, dto);
    return this.repo.save(c);
  }

  async delete(id: string) {
    const c = await this.findOne(id);
    await this.repo.remove(c);
  }
}
