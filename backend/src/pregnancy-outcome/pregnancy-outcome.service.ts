import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PregnancyOutcome } from './pregnancy-outcome.entity.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { PregnancyStatus } from '../pregnancies/pregnancy.enums.js';
import { CreatePregnancyOutcomeDto } from './dto/create-pregnancy-outcome.dto.js';
import { UpdatePregnancyOutcomeDto } from './dto/update-pregnancy-outcome.dto.js';

@Injectable()
export class PregnancyOutcomeService {
  constructor(
    @InjectRepository(PregnancyOutcome) private readonly repo: Repository<PregnancyOutcome>,
    private readonly pregnanciesService: PregnanciesService,
  ) {}

  async create(pregnancyId: string, dto: CreatePregnancyOutcomeDto): Promise<PregnancyOutcome> {
    const outcome = this.repo.create({ ...dto, pregnancyId });
    const saved = await this.repo.save(outcome);

    // Atualizar status da gestação para 'completed'
    await this.pregnanciesService.update(pregnancyId, { status: PregnancyStatus.COMPLETED });

    return saved;
  }

  async findOne(pregnancyId: string): Promise<PregnancyOutcome> {
    const outcome = await this.repo.findOneBy({ pregnancyId });
    if (!outcome) throw new NotFoundException(`Desfecho nao encontrado para gestacao ${pregnancyId}`);
    return outcome;
  }

  async update(pregnancyId: string, dto: UpdatePregnancyOutcomeDto): Promise<PregnancyOutcome> {
    const outcome = await this.findOne(pregnancyId);
    Object.assign(outcome, dto);
    return this.repo.save(outcome);
  }
}
