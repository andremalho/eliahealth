import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfertilityWorkup } from './infertility-workup.entity.js';
import { CreateInfertilityWorkupDto } from './dto/create-infertility-workup.dto.js';
import { UpdateInfertilityWorkupDto } from './dto/update-infertility-workup.dto.js';
import {
  InfertilityAlert,
  InfertilityDiagnosis,
} from './infertility-workup.enums.js';
import { verifyPatientTenant } from '../common/tenant.js';

@Injectable()
export class InfertilityWorkupsService {
  constructor(
    @InjectRepository(InfertilityWorkup)
    private readonly repo: Repository<InfertilityWorkup>,
  ) {}

  async create(
    patientId: string,
    dto: CreateInfertilityWorkupDto,
    tenantId: string | null,
  ): Promise<InfertilityWorkup> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const workup = this.repo.create({ ...dto, patientId, tenantId });
    this.applyEvaluationFlags(workup);
    this.evaluateAlerts(workup);
    return this.repo.save(workup);
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
      order: { workupDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<InfertilityWorkup> {
    const workup = await this.repo.findOneBy({ id });
    if (!workup) {
      throw new NotFoundException(`Investigação de infertilidade ${id} nao encontrada`);
    }
    if (tenantId && workup.tenantId && workup.tenantId !== tenantId) {
      throw new NotFoundException(`Investigação de infertilidade ${id} nao encontrada`);
    }
    return workup;
  }

  async update(
    id: string,
    dto: UpdateInfertilityWorkupDto,
    tenantId: string | null,
  ): Promise<InfertilityWorkup> {
    const workup = await this.findOne(id, tenantId);
    Object.assign(workup, dto);
    this.applyEvaluationFlags(workup);
    this.evaluateAlerts(workup);
    return this.repo.save(workup);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    const workup = await this.findOne(id, tenantId);
    await this.repo.remove(workup);
  }

  // ── Flags de elegibilidade automática (ACOG CO 781) ──
  private applyEvaluationFlags(workup: InfertilityWorkup): void {
    // ≥ 35 anos → 6 meses tentando justifica avaliação
    if (workup.ageAtPresentation >= 35 && workup.durationMonths >= 6) {
      workup.expeditedEvaluation = true;
    }
    // ≥ 40 anos → avaliação imediata
    if (workup.ageAtPresentation >= 40) {
      workup.immediateEvaluation = true;
    }
  }

  // ── Copiloto: regras clínicas ──
  private evaluateAlerts(workup: InfertilityWorkup): void {
    const alerts: InfertilityAlert[] = [];

    // Idade ≥ 40 → avaliação imediata
    if (workup.ageAtPresentation >= 40) {
      alerts.push({
        type: 'advanced_maternal_age',
        message: `Idade ${workup.ageAtPresentation} anos — avaliação imediata e considerar TRA precoce`,
        severity: 'urgent',
      });
    } else if (workup.ageAtPresentation >= 35) {
      alerts.push({
        type: 'maternal_age_35plus',
        message: `Idade ${workup.ageAtPresentation} anos — avaliação acelerada (6 meses)`,
        severity: 'warning',
      });
    }

    // Reserva ovariana baixa
    const reserve = workup.ovarianReserve as
      | {
          amh?: { value_ng_ml?: number; interpretation?: string };
          antralFollicleCount?: { value?: number };
          fsh?: { value?: number };
        }
      | null;
    if (reserve?.amh?.value_ng_ml !== undefined) {
      const amh = Number(reserve.amh.value_ng_ml);
      if (amh < 0.5) {
        alerts.push({
          type: 'amh_very_low',
          message: `AMH ${amh} ng/mL — reserva ovariana muito reduzida`,
          severity: 'urgent',
        });
      } else if (amh < 1.1) {
        alerts.push({
          type: 'amh_low',
          message: `AMH ${amh} ng/mL — reserva ovariana baixa`,
          severity: 'warning',
        });
      }
    }
    if (reserve?.antralFollicleCount?.value !== undefined) {
      const afc = Number(reserve.antralFollicleCount.value);
      if (afc < 5) {
        alerts.push({
          type: 'afc_low',
          message: `CFA ${afc} — contagem de folículos antrais baixa`,
          severity: 'warning',
        });
      }
    }
    if (reserve?.fsh?.value !== undefined) {
      const fsh = Number(reserve.fsh.value);
      if (fsh > 10) {
        alerts.push({
          type: 'fsh_elevated',
          message: `FSH basal ${fsh} mUI/mL — sugere reserva reduzida`,
          severity: 'warning',
        });
      }
    }

    // Espermograma alterado (OMS 2021 — limites inferiores)
    const semen = workup.semenAnalysis as
      | {
          concentration_M_ml?: number;
          progressiveMotility_pct?: number;
          morphology_pct_kruger?: number;
          totalMotility_pct?: number;
        }
      | null;
    if (semen) {
      if (semen.concentration_M_ml !== undefined && Number(semen.concentration_M_ml) < 16) {
        alerts.push({
          type: 'oligozoospermia',
          message: `Concentração ${semen.concentration_M_ml} M/mL — oligozoospermia`,
          severity: 'warning',
        });
      }
      if (semen.progressiveMotility_pct !== undefined && Number(semen.progressiveMotility_pct) < 30) {
        alerts.push({
          type: 'asthenozoospermia',
          message: `Motilidade progressiva ${semen.progressiveMotility_pct}% — astenozoospermia`,
          severity: 'warning',
        });
      }
      if (semen.morphology_pct_kruger !== undefined && Number(semen.morphology_pct_kruger) < 4) {
        alerts.push({
          type: 'teratozoospermia',
          message: `Morfologia Kruger ${semen.morphology_pct_kruger}% — teratozoospermia`,
          severity: 'warning',
        });
      }
    }

    // DFI alterado
    const dfi = workup.dnaFragmentation as { dfi_pct?: number } | null;
    if (dfi?.dfi_pct !== undefined && Number(dfi.dfi_pct) > 30) {
      alerts.push({
        type: 'high_dfi',
        message: `Fragmentação de DNA espermático ${dfi.dfi_pct}% — considerar ICSI`,
        severity: 'warning',
      });
    }

    // Diagnóstico de POI
    if (workup.primaryDiagnosis === InfertilityDiagnosis.PREMATURE_OVARIAN_INSUFFICIENCY) {
      alerts.push({
        type: 'poi',
        message: 'Insuficiência ovariana prematura — discutir doação de óvulos e THM precoce',
        severity: 'urgent',
      });
    }

    // Anomalia mülleriana
    if (workup.mullerianAnomaly) {
      alerts.push({
        type: 'mullerian_anomaly',
        message: `Anomalia mülleriana${workup.mullerianAnomalyType ? ` (${workup.mullerianAnomalyType})` : ''} — risco gestacional aumentado`,
        severity: 'warning',
      });
    }

    workup.alerts = alerts.length > 0 ? alerts : null;
  }
}
