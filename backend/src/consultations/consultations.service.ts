import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultation } from './consultation.entity.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { CreateConsultationDto } from './dto/create-consultation.dto.js';
import { UpdateConsultationDto } from './dto/update-consultation.dto.js';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private readonly repo: Repository<Consultation>,
    private readonly pregnanciesService: PregnanciesService,
  ) {}

  async create(pregnancyId: string, dto: CreateConsultationDto): Promise<Consultation> {
    const pregnancy = await this.pregnanciesService.findOne(pregnancyId);
    const ga = this.pregnanciesService.getGestationalAge(pregnancy, new Date(dto.date));

    const consultation = this.repo.create({
      ...dto,
      pregnancyId,
      gestationalAgeDays: ga.totalDays,
    });
    return this.repo.save(consultation);
  }

  async findAllByPregnancy(pregnancyId: string): Promise<Consultation[]> {
    return this.repo.find({
      where: { pregnancyId },
      order: { date: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Consultation> {
    const consultation = await this.repo.findOneBy({ id });
    if (!consultation) {
      throw new NotFoundException(`Consulta ${id} nao encontrada`);
    }
    return consultation;
  }

  async update(id: string, dto: UpdateConsultationDto): Promise<Consultation> {
    const consultation = await this.findOne(id);

    if (dto.date && dto.date !== consultation.date) {
      const pregnancy = await this.pregnanciesService.findOne(consultation.pregnancyId);
      const ga = this.pregnanciesService.getGestationalAge(pregnancy, new Date(dto.date));
      consultation.gestationalAgeDays = ga.totalDays;
    }

    Object.assign(consultation, dto);
    return this.repo.save(consultation);
  }
}
