import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { GynecologyConsultation } from './gynecology-consultation.entity.js';
import { CreateGynecologyConsultationDto } from './dto/create-gynecology-consultation.dto.js';
import { UpdateGynecologyConsultationDto } from './dto/update-gynecology-consultation.dto.js';
import {
  BiRads,
  GynecologyAlert,
  SmokingStatus,
} from './gynecology-consultation.enums.js';
import { verifyPatientTenant } from '../common/tenant.js';

@Injectable()
export class GynecologyConsultationsService {
  constructor(
    @InjectRepository(GynecologyConsultation)
    private readonly repo: Repository<GynecologyConsultation>,
  ) {}

  async create(
    patientId: string,
    dto: CreateGynecologyConsultationDto,
    tenantId: string | null,
  ): Promise<GynecologyConsultation> {
    await verifyPatientTenant(this.repo, patientId, tenantId);

    const consultation = this.repo.create({
      ...dto,
      patientId,
      tenantId,
    });

    // BMI auto-calc se peso e altura presentes
    if (consultation.weight && consultation.height && !consultation.bmi) {
      const heightM = Number(consultation.height) / 100;
      if (heightM > 0) {
        consultation.bmi = Number(
          (Number(consultation.weight) / (heightM * heightM)).toFixed(2),
        );
      }
    }

    this.evaluateAlerts(consultation);
    return this.repo.save(consultation);
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
      order: { consultationDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findInDateRange(
    patientId: string,
    tenantId: string | null,
    dateFrom: string,
    dateTo: string,
  ): Promise<GynecologyConsultation[]> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const where: Record<string, unknown> = {
      patientId,
      consultationDate: Between(dateFrom, dateTo),
    };
    if (tenantId) where.tenantId = tenantId;
    return this.repo.find({ where, order: { consultationDate: 'DESC' } });
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<GynecologyConsultation> {
    const consultation = await this.repo.findOneBy({ id });
    if (!consultation) {
      throw new NotFoundException(`Consulta ginecologica ${id} nao encontrada`);
    }
    if (
      tenantId &&
      consultation.tenantId &&
      consultation.tenantId !== tenantId
    ) {
      throw new NotFoundException(`Consulta ginecologica ${id} nao encontrada`);
    }
    return consultation;
  }

  async update(
    id: string,
    dto: UpdateGynecologyConsultationDto,
    tenantId: string | null,
  ): Promise<GynecologyConsultation> {
    const consultation = await this.findOne(id, tenantId);
    Object.assign(consultation, dto);

    if (consultation.weight && consultation.height) {
      const heightM = Number(consultation.height) / 100;
      if (heightM > 0) {
        consultation.bmi = Number(
          (Number(consultation.weight) / (heightM * heightM)).toFixed(2),
        );
      }
    }

    this.evaluateAlerts(consultation);
    return this.repo.save(consultation);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    const consultation = await this.findOne(id, tenantId);
    await this.repo.remove(consultation);
  }

  // ── Copiloto: avaliação de alertas clínicos ──
  // Mesmo padrão de evaluateAlert do BpMonitoringService: o service preenche
  // a coluna `alerts` (jsonb) e o CopilotModule consome esses sinais para
  // sugestões e indicadores agregados.
  private evaluateAlerts(consultation: GynecologyConsultation): void {
    const alerts: GynecologyAlert[] = [];

    // PA elevada
    if (
      consultation.bloodPressureSystolic &&
      consultation.bloodPressureDiastolic
    ) {
      const s = consultation.bloodPressureSystolic;
      const d = consultation.bloodPressureDiastolic;
      if (s >= 160 || d >= 110) {
        alerts.push({
          type: 'blood_pressure_critical',
          message: `PA crítica ${s}/${d} mmHg — avaliação imediata`,
          severity: 'urgent',
        });
      } else if (s >= 140 || d >= 90) {
        alerts.push({
          type: 'blood_pressure_elevated',
          message: `PA elevada ${s}/${d} mmHg — investigar HAS`,
          severity: 'warning',
        });
      }
    }

    // BMI
    if (consultation.bmi) {
      const bmi = Number(consultation.bmi);
      if (bmi >= 30) {
        alerts.push({
          type: 'obesity',
          message: `IMC ${bmi.toFixed(1)} — obesidade, risco metabólico`,
          severity: 'warning',
        });
      } else if (bmi < 18.5) {
        alerts.push({
          type: 'underweight',
          message: `IMC ${bmi.toFixed(1)} — baixo peso`,
          severity: 'warning',
        });
      }
    }

    // BI-RADS
    if (
      consultation.biradsClassification &&
      [
        BiRads.BIRADS_4A,
        BiRads.BIRADS_4B,
        BiRads.BIRADS_4C,
        BiRads.BIRADS_5,
        BiRads.BIRADS_6,
      ].includes(consultation.biradsClassification)
    ) {
      alerts.push({
        type: 'birads_suspicious',
        message: `BI-RADS ${consultation.biradsClassification} — encaminhar para mastologia`,
        severity: 'urgent',
      });
    } else if (consultation.biradsClassification === BiRads.BIRADS_3) {
      alerts.push({
        type: 'birads_followup',
        message: 'BI-RADS 3 — controle em 6 meses',
        severity: 'info',
      });
    }

    // Saúde mental
    if (consultation.phq2Score !== null && (consultation.phq2Score ?? 0) >= 3) {
      alerts.push({
        type: 'phq2_positive',
        message: `PHQ-2 ${consultation.phq2Score} — rastreio positivo para depressão`,
        severity: 'warning',
      });
    }
    if (consultation.gad2Score !== null && (consultation.gad2Score ?? 0) >= 3) {
      alerts.push({
        type: 'gad2_positive',
        message: `GAD-2 ${consultation.gad2Score} — rastreio positivo para ansiedade`,
        severity: 'warning',
      });
    }

    // Tabagismo
    if (consultation.smokingStatus === SmokingStatus.CURRENT) {
      alerts.push({
        type: 'smoking_current',
        message: 'Tabagismo ativo — orientar cessação',
        severity: 'warning',
      });
    }

    // Rastreios em atraso (heurística simples)
    const today = new Date(consultation.consultationDate);
    if (consultation.lastPapSmear) {
      const last = new Date(consultation.lastPapSmear);
      const months =
        (today.getFullYear() - last.getFullYear()) * 12 +
        (today.getMonth() - last.getMonth());
      if (months > 36) {
        alerts.push({
          type: 'pap_smear_overdue',
          message: `Citopatológico há ${months} meses — solicitar`,
          severity: 'warning',
        });
      }
    }
    if (consultation.lastMammography) {
      const last = new Date(consultation.lastMammography);
      const months =
        (today.getFullYear() - last.getFullYear()) * 12 +
        (today.getMonth() - last.getMonth());
      if (months > 24) {
        alerts.push({
          type: 'mammography_overdue',
          message: `Mamografia há ${months} meses — solicitar`,
          severity: 'warning',
        });
      }
    }

    // Histórico familiar oncológico relevante
    if (
      consultation.familyHistoryBreastCancer ||
      consultation.familyHistoryOvarianCancer
    ) {
      alerts.push({
        type: 'hereditary_cancer_risk',
        message:
          'História familiar de câncer de mama/ovário — considerar avaliação genética',
        severity: 'info',
      });
    }

    consultation.alerts = alerts.length > 0 ? alerts : null;
  }
}
