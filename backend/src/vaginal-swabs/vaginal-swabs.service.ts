import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VaginalSwab, SwabExamType, SwabStatus, DST_TYPES } from './vaginal-swab.entity.js';
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

  async findAll(pregnancyId: string): Promise<VaginalSwab[]> {
    return this.repo.find({ where: { pregnancyId }, order: { collectionDate: 'DESC' } });
  }

  async update(id: string, dto: UpdateVaginalSwabDto): Promise<VaginalSwab> {
    const swab = await this.repo.findOneBy({ id });
    if (!swab) throw new NotFoundException(`Coleta vaginal ${id} nao encontrada`);
    Object.assign(swab, dto);
    this.evaluateAlert(swab);
    return this.repo.save(swab);
  }

  private evaluateAlert(swab: VaginalSwab): void {
    if (!swab.result) { swab.status = SwabStatus.PENDING; return; }
    const lower = swab.result.toLowerCase();
    const isPositive = lower.includes('positivo') || lower.includes('reagente') || lower.includes('presente');

    if (swab.examType === SwabExamType.STREPTOCOCCUS_B && isPositive) {
      swab.status = SwabStatus.CRITICAL; swab.alertTriggered = true;
      swab.alertMessage = 'GBS positivo — profilaxia intraparto obrigatória';
      return;
    }
    if (DST_TYPES.includes(swab.examType) && isPositive) {
      swab.status = SwabStatus.CRITICAL; swab.alertTriggered = true;
      swab.alertMessage = `${swab.examType} positivo — tratamento imediato necessário`;
      return;
    }
    if (swab.examType === SwabExamType.ONCOTIC_CYTOLOGY && (lower.includes('alterado') || lower.includes('asc') || lower.includes('lsil') || lower.includes('hsil'))) {
      swab.status = SwabStatus.ALTERED; swab.alertTriggered = true;
      swab.alertMessage = 'Citologia oncótica alterada — encaminhar para colposcopia';
      return;
    }
    swab.status = SwabStatus.NORMAL; swab.alertTriggered = false; swab.alertMessage = null;
  }
}
