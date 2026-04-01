import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabResult } from './lab-result.entity.js';
import { LabDocument } from './lab-document.entity.js';
import {
  ExamCategory,
  LabResultStatus,
  INFECTIOUS_CATEGORIES,
} from './lab-result.enums.js';
import { CreateLabResultDto } from './dto/create-lab-result.dto.js';
import { UpdateLabResultDto } from './dto/update-lab-result.dto.js';
import { CreateLabDocumentDto } from './dto/create-lab-document.dto.js';

@Injectable()
export class LabResultsService {
  constructor(
    @InjectRepository(LabResult)
    private readonly resultRepo: Repository<LabResult>,
    @InjectRepository(LabDocument)
    private readonly documentRepo: Repository<LabDocument>,
  ) {}

  // ── LabResult CRUD ──

  async create(pregnancyId: string, dto: CreateLabResultDto): Promise<LabResult> {
    const labResult = this.resultRepo.create({ ...dto, pregnancyId });
    this.evaluateStatusAndAlerts(labResult);
    return this.resultRepo.save(labResult);
  }

  async findAllByPregnancy(
    pregnancyId: string,
    filters: { category?: ExamCategory; status?: LabResultStatus },
  ): Promise<LabResult[]> {
    const where: Record<string, unknown> = { pregnancyId };
    if (filters.category) where.examCategory = filters.category;
    if (filters.status) where.status = filters.status;

    return this.resultRepo.find({
      where,
      order: { requestedAt: 'DESC' },
    });
  }

  async findAlerts(pregnancyId: string): Promise<LabResult[]> {
    return this.resultRepo.find({
      where: { pregnancyId, alertTriggered: true },
      order: { resultDate: 'DESC' },
    });
  }

  async findTimeline(pregnancyId: string) {
    const results = await this.resultRepo.find({
      where: { pregnancyId },
      order: { resultDate: 'ASC' },
    });

    const grouped: Record<string, LabResult[]> = {};
    for (const r of results) {
      const key = r.examCategory;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }
    return grouped;
  }

  async findOne(id: string): Promise<LabResult> {
    const result = await this.resultRepo.findOneBy({ id });
    if (!result) {
      throw new NotFoundException(`Exame ${id} nao encontrado`);
    }
    return result;
  }

  async update(id: string, dto: UpdateLabResultDto): Promise<LabResult> {
    const labResult = await this.findOne(id);
    Object.assign(labResult, dto);
    this.evaluateStatusAndAlerts(labResult);
    // TODO: integração com IA — após atualizar resultado, disparar análise automática e preencher aiInterpretation
    return this.resultRepo.save(labResult);
  }

  // ── LabDocument CRUD ──

  async createDocument(pregnancyId: string, dto: CreateLabDocumentDto): Promise<LabDocument> {
    const doc = this.documentRepo.create({ ...dto, pregnancyId });
    // TODO: OCR pipeline — após salvar, enfileirar job para extrair texto do PDF/imagem e atualizar extractedText
    return this.documentRepo.save(doc);
  }

  async findDocumentsByPregnancy(pregnancyId: string): Promise<LabDocument[]> {
    return this.documentRepo.find({
      where: { pregnancyId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Status & Alert Logic ──

  private evaluateStatusAndAlerts(labResult: LabResult): void {
    // Sem resultado ainda → pending
    if (!labResult.value && !labResult.resultText) {
      labResult.status = LabResultStatus.PENDING;
      labResult.alertTriggered = false;
      labResult.alertMessage = null;
      return;
    }

    // Resultado textual em categorias infecciosas
    if (labResult.resultText && INFECTIOUS_CATEGORIES.includes(labResult.examCategory)) {
      const lower = labResult.resultText.toLowerCase();
      if (lower.includes('reagente') || lower.includes('positivo')) {
        labResult.status = LabResultStatus.CRITICAL;
        labResult.alertTriggered = true;
        labResult.alertMessage =
          `${labResult.examName}: resultado ${labResult.resultText} — necessita avaliacao imediata`;
        return;
      }
    }

    // Resultado numérico com faixa de referência
    const numericValue = parseFloat(labResult.value ?? '');
    if (!isNaN(numericValue) && (labResult.referenceMin != null || labResult.referenceMax != null)) {
      const min = labResult.referenceMin != null ? Number(labResult.referenceMin) : null;
      const max = labResult.referenceMax != null ? Number(labResult.referenceMax) : null;

      let deviationPercent = 0;
      let direction = '';

      if (min != null && numericValue < min) {
        deviationPercent = min !== 0 ? ((min - numericValue) / Math.abs(min)) * 100 : 100;
        direction = 'abaixo';
      } else if (max != null && numericValue > max) {
        deviationPercent = max !== 0 ? ((numericValue - max) / Math.abs(max)) * 100 : 100;
        direction = 'acima';
      }

      if (deviationPercent === 0) {
        labResult.status = LabResultStatus.NORMAL;
        labResult.alertTriggered = false;
        labResult.alertMessage = null;
      } else if (deviationPercent <= 20) {
        labResult.status = LabResultStatus.ATTENTION;
        labResult.alertTriggered = true;
        labResult.alertMessage =
          `${labResult.examName}: ${numericValue} ${labResult.unit ?? ''} — ${direction} do intervalo de referencia (desvio ${deviationPercent.toFixed(1)}%)`;
      } else {
        labResult.status = LabResultStatus.CRITICAL;
        labResult.alertTriggered = true;
        labResult.alertMessage =
          `${labResult.examName}: ${numericValue} ${labResult.unit ?? ''} — ${direction} do intervalo de referencia (desvio ${deviationPercent.toFixed(1)}%)`;
      }
      return;
    }

    // Sem regra aplicável → normal por padrão
    labResult.status = LabResultStatus.NORMAL;
    labResult.alertTriggered = false;
    labResult.alertMessage = null;
  }
}
