import { Injectable, NotFoundException } from '@nestjs/common';
import { verifySubResourceTenant } from '../common/tenant.js';
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
    filters: { category?: ExamCategory; status?: LabResultStatus; page?: number; limit?: number },
  ) {
    const where: Record<string, unknown> = { pregnancyId };
    if (filters.category) where.examCategory = filters.category;
    if (filters.status) where.status = filters.status;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const [data, total] = await this.resultRepo.findAndCount({
      where,
      order: { requestedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  async findOne(id: string, tenantId?: string | null): Promise<LabResult> {
    const result = await this.resultRepo.findOneBy({ id });
    if (!result) {
      throw new NotFoundException(`Exame ${id} nao encontrado`);
    }
    await verifySubResourceTenant(this.resultRepo, 'lab_results', id, tenantId ?? null);
    return result;
  }

  async update(id: string, dto: UpdateLabResultDto): Promise<LabResult> {
    const labResult = await this.findOne(id);
    Object.assign(labResult, dto);
    this.evaluateStatusAndAlerts(labResult);
    // TODO: integração com IA — após atualizar resultado, disparar análise automática e preencher aiInterpretation
    return this.resultRepo.save(labResult);
  }

  async reviewPatientExam(id: string, reviewStatus: string, notes?: string) {
    const exam = await this.findOne(id);
    await this.resultRepo.query(
      `UPDATE lab_results SET review_status = $1, notes = COALESCE($2, notes) WHERE id = $3`,
      [reviewStatus, notes ?? null, id],
    );
    return { id, reviewStatus, notes };
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

    // Alertas específicos HELLP / pré-eclâmpsia (por nome do exame)
    const numericValue = parseFloat(labResult.value ?? '');
    if (!isNaN(numericValue)) {
      const hellpAlert = this.evaluateHellpAlerts(labResult.examName, numericValue, labResult.unit ?? '');
      if (hellpAlert) {
        labResult.status = hellpAlert.status;
        labResult.alertTriggered = true;
        labResult.alertMessage = hellpAlert.message;
        return;
      }
    }

    // Resultado numérico com faixa de referência genérica
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

  private evaluateHellpAlerts(
    examName: string,
    value: number,
    unit: string,
  ): { status: LabResultStatus; message: string } | null {
    const name = examName.toLowerCase();

    // TGO (AST)
    if (name.includes('tgo') || name.includes('ast') || name.includes('aspartato')) {
      if (value > 150) return { status: LabResultStatus.CRITICAL, message: `CRÍTICO: TGO gravemente elevada ${value} ${unit} — HELLP síndrome provável` };
      if (value > 70) return { status: LabResultStatus.ATTENTION, message: `TGO elevada ${value} ${unit} — investigar HELLP síndrome` };
    }

    // TGP (ALT)
    if (name.includes('tgp') || name.includes('alt') || name.includes('alanina')) {
      if (value > 150) return { status: LabResultStatus.CRITICAL, message: `CRÍTICO: TGP gravemente elevada ${value} ${unit} — HELLP síndrome provável` };
      if (value > 70) return { status: LabResultStatus.ATTENTION, message: `TGP elevada ${value} ${unit} — investigar HELLP síndrome` };
    }

    // DHL (LDH)
    if (name.includes('dhl') || name.includes('ldh') || name.includes('desidrogenase')) {
      if (value > 600) return { status: LabResultStatus.CRITICAL, message: `CRÍTICO: DHL elevada ${value} ${unit} — hemólise, investigar HELLP` };
    }

    // Plaquetas
    if (name.includes('plaqueta')) {
      if (value < 100000) return { status: LabResultStatus.CRITICAL, message: `CRÍTICO: Plaquetopenia grave ${value}/mm³ — HELLP síndrome` };
      if (value < 150000) return { status: LabResultStatus.ATTENTION, message: `Plaquetopenia ${value}/mm³ — monitorar HELLP` };
    }

    // Bilirrubina Total
    if ((name.includes('bilirrubina') && name.includes('total')) || name === 'bt') {
      if (value > 1.2) return { status: LabResultStatus.ATTENTION, message: `Bilirrubina total elevada ${value} ${unit} — investigar hemólise` };
    }

    // Ácido úrico
    if (name.includes('ácido úrico') || name.includes('acido urico') || name.includes('urato')) {
      if (value > 5.5) return { status: LabResultStatus.ATTENTION, message: `Hiperuricemia ${value} ${unit} — risco aumentado de pré-eclâmpsia/HELLP` };
    }

    return null;
  }
}
