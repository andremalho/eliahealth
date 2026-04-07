import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreventiveExamSchedule } from './preventive-exam-schedule.entity.js';
import { CreatePreventiveExamScheduleDto } from './dto/create-preventive-exam-schedule.dto.js';
import { UpdatePreventiveExamScheduleDto } from './dto/update-preventive-exam-schedule.dto.js';
import {
  PreventiveAlert,
  PreventiveAlertSeverity,
  PreventiveAlertType,
  PreventiveExamItem,
  PreventiveExamStatus,
} from './preventive-exam-schedule.enums.js';
import { verifyPatientTenant } from '../common/tenant.js';

@Injectable()
export class PreventiveExamScheduleService {
  constructor(
    @InjectRepository(PreventiveExamSchedule)
    private readonly repo: Repository<PreventiveExamSchedule>,
  ) {}

  async create(
    patientId: string,
    dto: CreatePreventiveExamScheduleDto,
    tenantId: string | null,
  ): Promise<PreventiveExamSchedule> {
    await verifyPatientTenant(this.repo, patientId, tenantId);

    const schedule = this.repo.create({
      ...dto,
      patientId,
      tenantId,
      vaccinationSchedule: dto.vaccinationSchedule ?? null,
      clinicalAlerts: dto.clinicalAlerts ?? null,
      notes: dto.notes ?? null,
    });

    this.evaluateAlerts(schedule);
    return this.repo.save(schedule);
  }

  async findAllByPatient(
    patientId: string,
    tenantId: string | null,
  ): Promise<PreventiveExamSchedule[]> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const where: Record<string, unknown> = { patientId };
    if (tenantId) where.tenantId = tenantId;
    return this.repo.find({ where, order: { generatedDate: 'DESC' } });
  }

  async findLatestByPatient(
    patientId: string,
    tenantId: string | null,
  ): Promise<PreventiveExamSchedule | null> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const where: Record<string, unknown> = { patientId };
    if (tenantId) where.tenantId = tenantId;
    return this.repo.findOne({ where, order: { generatedDate: 'DESC' } });
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<PreventiveExamSchedule> {
    const schedule = await this.repo.findOneBy({ id });
    if (!schedule) {
      throw new NotFoundException(`Cronograma preventivo ${id} nao encontrado`);
    }
    if (tenantId && schedule.tenantId && schedule.tenantId !== tenantId) {
      throw new NotFoundException(`Cronograma preventivo ${id} nao encontrado`);
    }
    return schedule;
  }

  async update(
    id: string,
    dto: UpdatePreventiveExamScheduleDto,
    tenantId: string | null,
  ): Promise<PreventiveExamSchedule> {
    const schedule = await this.findOne(id, tenantId);
    Object.assign(schedule, dto);
    this.evaluateAlerts(schedule);
    return this.repo.save(schedule);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    const schedule = await this.findOne(id, tenantId);
    await this.repo.remove(schedule);
  }

  // ── Copiloto: avaliação de alertas clínicos ──
  // Mantém o padrão do BpMonitoring/Consultations: o service preenche
  // alertas estruturados na própria linha; o CopilotModule consome esses
  // alertas posteriormente para sugestões agregadas.
  private evaluateAlerts(schedule: PreventiveExamSchedule): void {
    const alerts: PreventiveAlert[] = schedule.clinicalAlerts
      ? [...schedule.clinicalAlerts]
      : [];

    const today = new Date(schedule.generatedDate);

    for (const exam of schedule.examSchedule ?? []) {
      const due = new Date(exam.dueDate);
      const diffDays = Math.floor(
        (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (exam.status === PreventiveExamStatus.OVERDUE || diffDays < 0) {
        alerts.push({
          type: PreventiveAlertType.OVERDUE_EXAM,
          message: `${exam.examName} em atraso (vencido em ${exam.dueDate})`,
          severity: PreventiveAlertSeverity.URGENT,
        });
        continue;
      }

      if (exam.status === PreventiveExamStatus.DUE_SOON || diffDays <= 30) {
        alerts.push({
          type: PreventiveAlertType.DUE_SOON,
          message: `${exam.examName} a vencer em ${diffDays} dias`,
          severity: PreventiveAlertSeverity.WARNING,
        });
      }
    }

    for (const vac of schedule.vaccinationSchedule ?? []) {
      if (
        vac.status === PreventiveExamStatus.OVERDUE ||
        vac.status === PreventiveExamStatus.DUE_SOON
      ) {
        alerts.push({
          type: PreventiveAlertType.VACCINATION_DUE,
          message: `Vacina ${vac.vaccine} pendente`,
          severity:
            vac.status === PreventiveExamStatus.OVERDUE
              ? PreventiveAlertSeverity.URGENT
              : PreventiveAlertSeverity.WARNING,
        });
      }
    }

    schedule.clinicalAlerts = alerts.length > 0 ? alerts : null;
  }

  // ── Resumo agregado para dashboard ──
  async getSummary(patientId: string, tenantId: string | null) {
    const latest = await this.findLatestByPatient(patientId, tenantId);
    if (!latest) {
      return {
        hasSchedule: false,
        totalExams: 0,
        upToDate: 0,
        dueSoon: 0,
        overdue: 0,
        alertsCount: 0,
      };
    }

    const items: PreventiveExamItem[] = latest.examSchedule ?? [];
    const upToDate = items.filter(
      (e) => e.status === PreventiveExamStatus.UP_TO_DATE,
    ).length;
    const dueSoon = items.filter(
      (e) => e.status === PreventiveExamStatus.DUE_SOON,
    ).length;
    const overdue = items.filter(
      (e) => e.status === PreventiveExamStatus.OVERDUE,
    ).length;

    return {
      hasSchedule: true,
      scheduleId: latest.id,
      lifePhase: latest.lifePhase,
      generatedDate: latest.generatedDate,
      nextReviewDate: latest.nextReviewDate,
      totalExams: items.length,
      upToDate,
      dueSoon,
      overdue,
      alertsCount: latest.clinicalAlerts?.length ?? 0,
    };
  }
}
