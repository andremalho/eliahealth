import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenstrualCycleAssessment } from './menstrual-cycle-assessment.entity.js';
import { CreateMenstrualCycleAssessmentDto } from './dto/create-menstrual-cycle-assessment.dto.js';
import { UpdateMenstrualCycleAssessmentDto } from './dto/update-menstrual-cycle-assessment.dto.js';
import {
  MenstrualCycleAlert,
  MenstrualComplaint,
} from './menstrual-cycle-assessment.enums.js';
import { verifyPatientTenant } from '../common/tenant.js';

@Injectable()
export class MenstrualCycleAssessmentsService {
  constructor(
    @InjectRepository(MenstrualCycleAssessment)
    private readonly repo: Repository<MenstrualCycleAssessment>,
  ) {}

  async create(
    patientId: string,
    dto: CreateMenstrualCycleAssessmentDto,
    tenantId: string | null,
  ): Promise<MenstrualCycleAssessment> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const assessment = this.repo.create({ ...dto, patientId, tenantId });
    this.evaluateAlerts(assessment);
    return this.repo.save(assessment);
  }

  async findAllByPatient(
    patientId: string,
    tenantId: string | null,
    page = 1,
    limit = 50,
  ) {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const where: Record<string, unknown> = { patientId };
    if (tenantId) where.tenantId = tenantId;
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { assessmentDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<MenstrualCycleAssessment> {
    const assessment = await this.repo.findOneBy({ id });
    if (!assessment) {
      throw new NotFoundException(`Avaliação de ciclo menstrual ${id} nao encontrada`);
    }
    if (tenantId && assessment.tenantId && assessment.tenantId !== tenantId) {
      throw new NotFoundException(`Avaliação de ciclo menstrual ${id} nao encontrada`);
    }
    return assessment;
  }

  async update(
    id: string,
    dto: UpdateMenstrualCycleAssessmentDto,
    tenantId: string | null,
  ): Promise<MenstrualCycleAssessment> {
    const assessment = await this.findOne(id, tenantId);
    Object.assign(assessment, dto);
    this.evaluateAlerts(assessment);
    return this.repo.save(assessment);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    const assessment = await this.findOne(id, tenantId);
    await this.repo.remove(assessment);
  }

  // ── Copiloto: regras clínicas PALM-COEIN / SUA / FIGO ──
  private evaluateAlerts(assessment: MenstrualCycleAssessment): void {
    const alerts: MenstrualCycleAlert[] = [];

    // PBAC > 100 → menorragia objetiva
    if (
      assessment.pictorialBloodChart !== null &&
      (assessment.pictorialBloodChart ?? 0) > 100
    ) {
      alerts.push({
        type: 'pbac_high',
        message: `PBAC ${assessment.pictorialBloodChart} — sangramento objetivamente aumentado`,
        severity: 'warning',
      });
    }

    // Volume estimado > 80 mL → menorragia
    if (
      assessment.estimatedBloodVolumeMl !== null &&
      (assessment.estimatedBloodVolumeMl ?? 0) > 80
    ) {
      alerts.push({
        type: 'menorrhagia',
        message: `Volume estimado ${assessment.estimatedBloodVolumeMl} mL/ciclo — menorragia`,
        severity: 'warning',
      });
    }

    // Ciclo fora do padrão FIGO normal (24–38 dias)
    if (assessment.cycleIntervalDays) {
      if (assessment.cycleIntervalDays < 24) {
        alerts.push({
          type: 'cycle_short',
          message: `Ciclo curto (${assessment.cycleIntervalDays} dias) — investigar`,
          severity: 'info',
        });
      } else if (assessment.cycleIntervalDays > 38) {
        alerts.push({
          type: 'cycle_long',
          message: `Ciclo longo (${assessment.cycleIntervalDays} dias) — investigar oligo-ovulação`,
          severity: 'warning',
        });
      }
    }

    // Duração > 8 dias
    if (
      assessment.cycleDurationDays !== null &&
      (assessment.cycleDurationDays ?? 0) > 8
    ) {
      alerts.push({
        type: 'prolonged_menses',
        message: `Menstruação prolongada (${assessment.cycleDurationDays} dias)`,
        severity: 'warning',
      });
    }

    // PALM — alertas estruturais
    if (assessment.palmMalignancyOrHyperplasia) {
      alerts.push({
        type: 'malignancy_suspicion',
        message: 'Suspeita/diagnóstico de malignidade ou hiperplasia — encaminhamento urgente',
        severity: 'urgent',
      });
    }
    if (assessment.palmLeiomyoma && assessment.palmLeiomyomaLocation) {
      const submucosal = ['submucosal_0', 'submucosal_1', 'submucosal_2'];
      if (submucosal.includes(assessment.palmLeiomyomaLocation)) {
        alerts.push({
          type: 'submucosal_myoma',
          message: `Mioma submucoso FIGO ${assessment.palmLeiomyomaLocation} — alta chance de SUA, considerar histeroscopia`,
          severity: 'warning',
        });
      }
    }

    // PCOS Rotterdam ≥ 2 critérios
    if (assessment.pcosRotterdamCriteria) {
      if (assessment.pcosRotterdamCriteria.criteriaCount >= 2) {
        alerts.push({
          type: 'pcos_rotterdam',
          message: `Rotterdam ${assessment.pcosRotterdamCriteria.criteriaCount}/3 critérios — compatível com SOP`,
          severity: 'info',
        });
      }
    }

    // HOMA-IR alterado
    if (assessment.pcosHomaIr !== null && Number(assessment.pcosHomaIr) > 2.7) {
      alerts.push({
        type: 'insulin_resistance',
        message: `HOMA-IR ${assessment.pcosHomaIr} — resistência insulínica`,
        severity: 'warning',
      });
    }

    // Coagulopatia → considerar AF/von Willebrand
    if (assessment.coeinCoagulopathy) {
      alerts.push({
        type: 'coagulopathy',
        message: `Coagulopatia (${assessment.coeinCoagulopathyType ?? 'tipo não especificado'}) — manejo multidisciplinar`,
        severity: 'warning',
      });
    }

    // Sangramento pós-coital → investigar colo
    if (assessment.chiefComplaint === MenstrualComplaint.POSTCOITAL_BLEEDING) {
      alerts.push({
        type: 'postcoital_bleeding',
        message: 'Sangramento pós-coital — investigar lesão cervical (colposcopia/biópsia)',
        severity: 'warning',
      });
    }

    // Amenorreia primária ≥ 15 anos → investigação obrigatória
    if (assessment.chiefComplaint === MenstrualComplaint.AMENORRHEA_PRIMARY) {
      alerts.push({
        type: 'primary_amenorrhea',
        message: 'Amenorreia primária — investigação completa (anatomia, hormônios, cariótipo)',
        severity: 'urgent',
      });
    }

    assessment.alerts = alerts.length > 0 ? alerts : null;
  }
}
