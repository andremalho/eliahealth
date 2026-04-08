import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VaginalSwab, SwabExamType, SwabStatus, SwabResultDropdown,
  DST_TYPES, DROPDOWN_EXAM_TYPES,
} from './vaginal-swab.entity.js';
import { CreateVaginalSwabDto } from './dto/create-vaginal-swab.dto.js';
import { UpdateVaginalSwabDto } from './dto/update-vaginal-swab.dto.js';

@Injectable()
export class VaginalSwabsService {
  constructor(@InjectRepository(VaginalSwab) private readonly repo: Repository<VaginalSwab>) {}

  async create(pregnancyId: string, dto: CreateVaginalSwabDto): Promise<VaginalSwab> {
    const swab = this.repo.create({ ...dto, pregnancyId });
    this.evaluateAlert(swab);
    return this.repo.save(swab);
  }

  async findAll(pregnancyId: string, page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      where: { pregnancyId },
      order: { collectionDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, dto: UpdateVaginalSwabDto): Promise<VaginalSwab> {
    const swab = await this.repo.findOneBy({ id });
    if (!swab) throw new NotFoundException(`Coleta vaginal ${id} nao encontrada`);
    Object.assign(swab, dto);
    this.evaluateAlert(swab);
    return this.repo.save(swab);
  }

  async remove(id: string): Promise<void> {
    const swab = await this.repo.findOneBy({ id });
    if (!swab) throw new NotFoundException(`Coleta vaginal ${id} nao encontrada`);
    await this.repo.remove(swab);
  }

  private evaluateAlert(swab: VaginalSwab): void {
    // For dropdown-based exams, use resultDropdown
    if (DROPDOWN_EXAM_TYPES.includes(swab.examType) && swab.resultDropdown) {
      this.evaluateDropdownResult(swab);
      return;
    }

    if (!swab.result) { swab.status = SwabStatus.PENDING; return; }
    const lower = swab.result.toLowerCase();
    const isPositive = lower.includes('positivo') || lower.includes('reagente') || lower.includes('presente');

    if (
      (swab.examType === SwabExamType.STREPTOCOCCUS_B || swab.examType === SwabExamType.PCR_STREPTOCOCCUS) &&
      isPositive
    ) {
      swab.status = SwabStatus.CRITICAL; swab.alertTriggered = true;
      swab.alertMessage = 'GBS positivo — profilaxia intraparto obrigatoria';
      return;
    }
    if (DST_TYPES.includes(swab.examType) && isPositive) {
      swab.status = SwabStatus.CRITICAL; swab.alertTriggered = true;
      swab.alertMessage = `${swab.examType} positivo — tratamento imediato necessario`;
      return;
    }
    if (
      (swab.examType === SwabExamType.ONCOTIC_CYTOLOGY || swab.examType === SwabExamType.COLPOCITOLOGIA_ONCOTICA) &&
      (lower.includes('alterado') || lower.includes('asc') || lower.includes('lsil') || lower.includes('hsil'))
    ) {
      swab.status = SwabStatus.ALTERED; swab.alertTriggered = true;
      swab.alertMessage = 'Citologia oncotica alterada — encaminhar para colposcopia';
      return;
    }
    swab.status = SwabStatus.NORMAL; swab.alertTriggered = false; swab.alertMessage = null;
  }

  private evaluateDropdownResult(swab: VaginalSwab): void {
    const dd = swab.resultDropdown!;

    if (swab.examType === SwabExamType.PCR_STREPTOCOCCUS) {
      if (dd === SwabResultDropdown.POSITIVE) {
        swab.status = SwabStatus.CRITICAL; swab.alertTriggered = true;
        swab.alertMessage = 'GBS positivo — profilaxia intraparto obrigatoria';
      } else {
        swab.status = SwabStatus.NORMAL; swab.alertTriggered = false; swab.alertMessage = null;
      }
      return;
    }

    if (swab.examType === SwabExamType.PCR_HPV) {
      if (dd === SwabResultDropdown.HIGH_RISK) {
        swab.status = SwabStatus.CRITICAL; swab.alertTriggered = true;
        swab.alertMessage = 'HPV alto risco detectado — encaminhar para colposcopia';
      } else if (dd === SwabResultDropdown.POSITIVE || dd === SwabResultDropdown.LOW_RISK) {
        swab.status = SwabStatus.ALTERED; swab.alertTriggered = true;
        swab.alertMessage = 'HPV detectado — acompanhamento recomendado';
      } else {
        swab.status = SwabStatus.NORMAL; swab.alertTriggered = false; swab.alertMessage = null;
      }
      return;
    }

    swab.status = SwabStatus.NORMAL; swab.alertTriggered = false; swab.alertMessage = null;
  }
}
