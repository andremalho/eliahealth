import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtherExam } from './other-exam.entity.js';
import { CreateOtherExamDto } from './dto/create-other-exam.dto.js';
import { UpdateOtherExamDto } from './dto/update-other-exam.dto.js';

@Injectable()
export class OtherExamsService {
  constructor(
    @InjectRepository(OtherExam) private readonly repo: Repository<OtherExam>,
  ) {}

  async create(pregnancyId: string, dto: CreateOtherExamDto): Promise<OtherExam> {
    const exam = this.repo.create({ ...dto, pregnancyId });
    return this.repo.save(exam);
  }

  async findAll(pregnancyId: string, page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      where: { pregnancyId },
      order: { examDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<OtherExam> {
    const exam = await this.repo.findOneBy({ id });
    if (!exam) throw new NotFoundException(`Exame ${id} nao encontrado`);
    return exam;
  }

  async update(id: string, dto: UpdateOtherExamDto): Promise<OtherExam> {
    const exam = await this.findOne(id);
    Object.assign(exam, dto);
    return this.repo.save(exam);
  }

  async remove(id: string): Promise<void> {
    const exam = await this.findOne(id);
    await this.repo.remove(exam);
  }
}
