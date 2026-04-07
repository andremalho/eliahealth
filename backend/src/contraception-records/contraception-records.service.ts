import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContraceptionRecord } from './contraception-record.entity.js';
import { CreateContraceptionRecordDto } from './dto/create-contraception-record.dto.js';
import { UpdateContraceptionRecordDto } from './dto/update-contraception-record.dto.js';
import {
  ContraceptionAlert,
  ContraceptiveMethod,
  WHOMECCategory,
} from './contraception-record.enums.js';
import { verifyPatientTenant } from '../common/tenant.js';

const COMBINED_HORMONAL_METHODS: ContraceptiveMethod[] = [
  ContraceptiveMethod.COMBINED_ORAL,
  ContraceptiveMethod.COMBINED_INJECTABLE,
  ContraceptiveMethod.COMBINED_PATCH,
  ContraceptiveMethod.VAGINAL_RING,
];

@Injectable()
export class ContraceptionRecordsService {
  constructor(
    @InjectRepository(ContraceptionRecord)
    private readonly repo: Repository<ContraceptionRecord>,
  ) {}

  async create(
    patientId: string,
    dto: CreateContraceptionRecordDto,
    tenantId: string | null,
  ): Promise<ContraceptionRecord> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const record = this.repo.create({ ...dto, patientId, tenantId });
    this.evaluateAlerts(record);
    return this.repo.save(record);
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

  async findCurrent(
    patientId: string,
    tenantId: string | null,
  ): Promise<ContraceptionRecord | null> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const where: Record<string, unknown> = { patientId };
    if (tenantId) where.tenantId = tenantId;
    return this.repo.findOne({ where, order: { consultationDate: 'DESC' } });
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<ContraceptionRecord> {
    const record = await this.repo.findOneBy({ id });
    if (!record) {
      throw new NotFoundException(`Registro contraceptivo ${id} nao encontrado`);
    }
    if (tenantId && record.tenantId && record.tenantId !== tenantId) {
      throw new NotFoundException(`Registro contraceptivo ${id} nao encontrado`);
    }
    return record;
  }

  async update(
    id: string,
    dto: UpdateContraceptionRecordDto,
    tenantId: string | null,
  ): Promise<ContraceptionRecord> {
    const record = await this.findOne(id, tenantId);
    Object.assign(record, dto);
    this.evaluateAlerts(record);
    return this.repo.save(record);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    const record = await this.findOne(id, tenantId);
    await this.repo.remove(record);
  }

  // ── Copiloto: regras OMS MEC + lembretes de DIU/implante ──
  private evaluateAlerts(record: ContraceptionRecord): void {
    const alerts: ContraceptionAlert[] = [];
    const today = new Date(record.consultationDate);

    // OMS MEC categoria 4 → contraindicação absoluta
    if (record.whomecCategory === WHOMECCategory.CAT4) {
      alerts.push({
        type: 'whomec_cat4',
        message: 'OMS MEC categoria 4 — contraindicação absoluta para o método',
        severity: 'urgent',
      });
    } else if (record.whomecCategory === WHOMECCategory.CAT3) {
      alerts.push({
        type: 'whomec_cat3',
        message: 'OMS MEC categoria 3 — riscos superam vantagens, considerar alternativa',
        severity: 'warning',
      });
    }

    // CHC + tabagista ≥35 anos = MEC 4
    const proposed = record.methodPrescribed ?? record.currentMethod;
    if (
      proposed &&
      COMBINED_HORMONAL_METHODS.includes(proposed) &&
      record.smokingAge35Plus
    ) {
      alerts.push({
        type: 'chc_smoker_35plus',
        message: 'Contracepção hormonal combinada + tabagismo ≥35 anos = MEC 4 (contraindicado)',
        severity: 'urgent',
      });
    }

    // CHC + VTE ou trombofilia
    if (
      proposed &&
      COMBINED_HORMONAL_METHODS.includes(proposed) &&
      (record.historyOfVTE || record.thrombophilia)
    ) {
      alerts.push({
        type: 'chc_vte_risk',
        message: 'CHC contraindicado em história de TEV/trombofilia',
        severity: 'urgent',
      });
    }

    // CHC + enxaqueca com aura
    if (
      proposed &&
      COMBINED_HORMONAL_METHODS.includes(proposed) &&
      record.migraineWithAura
    ) {
      alerts.push({
        type: 'chc_migraine_aura',
        message: 'Enxaqueca com aura — CHC contraindicado (risco AVC)',
        severity: 'urgent',
      });
    }

    // CHC + HAS não controlada
    if (
      proposed &&
      COMBINED_HORMONAL_METHODS.includes(proposed) &&
      record.uncontrolledHypertension
    ) {
      alerts.push({
        type: 'chc_uncontrolled_htn',
        message: 'HAS não controlada — CHC contraindicado',
        severity: 'urgent',
      });
    }

    // Câncer de mama atual ou prévio → métodos hormonais MEC 3-4
    if (record.breastCancerHistory && proposed && proposed !== ContraceptiveMethod.COPPER_IUD) {
      const isHormonal = proposed !== ContraceptiveMethod.MALE_CONDOM &&
        proposed !== ContraceptiveMethod.FEMALE_CONDOM &&
        proposed !== ContraceptiveMethod.DIAPHRAGM &&
        proposed !== ContraceptiveMethod.TUBAL_LIGATION &&
        proposed !== ContraceptiveMethod.NONE;
      if (isHormonal) {
        alerts.push({
          type: 'breast_cancer_hormonal',
          message: 'História de câncer de mama — métodos hormonais MEC 3-4, preferir DIU-Cu',
          severity: 'urgent',
        });
      }
    }

    // DIU vencendo
    if (record.iudExpirationDate) {
      const exp = new Date(record.iudExpirationDate);
      const monthsToExpiry =
        (exp.getFullYear() - today.getFullYear()) * 12 +
        (exp.getMonth() - today.getMonth());
      if (monthsToExpiry < 0) {
        alerts.push({
          type: 'iud_expired',
          message: `DIU vencido (em ${record.iudExpirationDate}) — programar troca`,
          severity: 'urgent',
        });
      } else if (monthsToExpiry <= 3) {
        alerts.push({
          type: 'iud_expiring_soon',
          message: `DIU vence em ${monthsToExpiry} meses — agendar substituição`,
          severity: 'warning',
        });
      }
    }

    // Implante vencendo
    if (record.implantExpirationDate) {
      const exp = new Date(record.implantExpirationDate);
      const monthsToExpiry =
        (exp.getFullYear() - today.getFullYear()) * 12 +
        (exp.getMonth() - today.getMonth());
      if (monthsToExpiry < 0) {
        alerts.push({
          type: 'implant_expired',
          message: `Implante vencido (em ${record.implantExpirationDate})`,
          severity: 'urgent',
        });
      } else if (monthsToExpiry <= 3) {
        alerts.push({
          type: 'implant_expiring_soon',
          message: `Implante vence em ${monthsToExpiry} meses`,
          severity: 'warning',
        });
      }
    }

    // Amamentação + CHC = MEC 4 nos primeiros 6 meses
    if (record.breastfeeding && proposed && COMBINED_HORMONAL_METHODS.includes(proposed)) {
      alerts.push({
        type: 'breastfeeding_chc',
        message: 'Amamentação — CHC não recomendado, preferir minipílula/DMPA/DIU',
        severity: 'warning',
      });
    }

    // Desejo gestacional imediato
    if (record.desireForPregnancy === 'desires_now' && proposed && proposed !== ContraceptiveMethod.NONE) {
      alerts.push({
        type: 'desires_pregnancy',
        message: 'Paciente deseja engravidar — orientar suspensão do método e pré-concepcional',
        severity: 'info',
      });
    }

    record.alerts = alerts.length > 0 ? alerts : null;
  }
}
