import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { ResearchRecord } from './research-record.entity.js';
import { AgeGroup, CEP_REGION_MAP } from './research.enums.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { GlucoseMonitoringConfig } from '../glucose-monitoring/glucose-config.entity.js';
import { BpMonitoringConfig } from '../bp-monitoring/bp-config.entity.js';
import { PregnancyOutcome } from '../pregnancy-outcome/pregnancy-outcome.entity.js';

@Injectable()
export class ResearchService {
  constructor(
    @InjectRepository(ResearchRecord) private readonly repo: Repository<ResearchRecord>,
    @InjectRepository(Pregnancy) private readonly pregnancyRepo: Repository<Pregnancy>,
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    @InjectRepository(GlucoseMonitoringConfig) private readonly glucoseRepo: Repository<GlucoseMonitoringConfig>,
    @InjectRepository(BpMonitoringConfig) private readonly bpRepo: Repository<BpMonitoringConfig>,
    @InjectRepository(PregnancyOutcome) private readonly outcomeRepo: Repository<PregnancyOutcome>,
  ) {}

  // ── Anonymize & Save ──

  async anonymizeAndSave(pregnancyId: string): Promise<ResearchRecord> {
    const existing = await this.repo.findOneBy({ pregnancyId });
    if (existing) return existing;

    const pregnancy = await this.pregnancyRepo.findOneBy({ id: pregnancyId });
    if (!pregnancy) throw new NotFoundException(`Gestacao ${pregnancyId} nao encontrada`);

    const patient = await this.patientRepo.findOneBy({ id: pregnancy.patientId });
    if (!patient) throw new NotFoundException(`Paciente nao encontrada`);

    const outcome = await this.outcomeRepo.findOneBy({ pregnancyId });
    const glucoseConfig = await this.glucoseRepo.findOneBy({ pregnancyId });
    const bpConfig = await this.bpRepo.findOneBy({ pregnancyId });

    // Calcular idade anonimizada
    const maternalAge = this.calculateAge(patient.dateOfBirth);
    const ageGroup = this.getAgeGroup(maternalAge);

    // CEP parcial + região
    const zipCode = (patient as any).zipCode as string | null;
    const zipCodePartial = zipCode ? zipCode.substring(0, 5) : null;
    const regionInfo = this.getRegionFromCep(zipCodePartial);

    // Flags de condições
    const flags = pregnancy.highRiskFlags ?? [];
    const hasGdm = glucoseConfig?.isActive ?? false;
    const hasHtn = bpConfig?.isActive ?? false;

    const record = this.repo.create({
      researchId: this.generateResearchId(),
      pregnancyId,
      maternalAge,
      ageGroup,
      zipCodePartial,
      region: regionInfo?.region ?? null,
      state: regionInfo?.state ?? null,
      bloodType: patient.bloodType,
      gravida: pregnancy.gravida,
      para: pregnancy.para,
      abortus: pregnancy.abortus,
      plurality: pregnancy.plurality,
      chorionicity: pregnancy.chorionicity,
      gaAtDelivery: outcome?.gestationalAgeAtDelivery ?? null,
      deliveryType: outcome?.deliveryType ?? null,
      highRiskFlags: flags,
      gestationalDiabetes: hasGdm,
      hypertension: hasHtn,
      preeclampsia: flags.includes('preeclampsia'),
      hellpSyndrome: flags.includes('hellp'),
      fgr: flags.includes('fgr'),
      pretermBirth: outcome ? outcome.gestationalAgeAtDelivery < 259 : false, // < 37 semanas
      neonatalData: outcome?.neonatalData ?? null,
      consentForResearch: true,
      dataVersion: '1.0',
    });

    return this.repo.save(record);
  }

  // ── Consent ──

  async registerConsent(patientId: string): Promise<{ message: string; anonymized: number }> {
    const pregnancies = await this.pregnancyRepo.find({ where: { patientId } });
    let anonymized = 0;
    for (const p of pregnancies) {
      const existing = await this.repo.findOneBy({ pregnancyId: p.id });
      if (!existing) {
        await this.anonymizeAndSave(p.id);
        anonymized++;
      }
    }
    return { message: `Consentimento registrado. ${anonymized} gestacoes anonimizadas.`, anonymized };
  }

  // ── Query ──

  async findRecords(filters: {
    ageMin?: number; ageMax?: number; region?: string; condition?: string; deliveryType?: string;
  }): Promise<Omit<ResearchRecord, 'pregnancyId' | 'pregnancy'>[]> {
    const qb = this.repo.createQueryBuilder('r');

    if (filters.ageMin) qb.andWhere('r.maternal_age >= :ageMin', { ageMin: filters.ageMin });
    if (filters.ageMax) qb.andWhere('r.maternal_age <= :ageMax', { ageMax: filters.ageMax });
    if (filters.region) qb.andWhere('r.region = :region', { region: filters.region });
    if (filters.deliveryType) qb.andWhere('r.delivery_type = :dt', { dt: filters.deliveryType });

    if (filters.condition) {
      const col = this.conditionToColumn(filters.condition);
      if (col) qb.andWhere(`r.${col} = true`);
    }

    qb.orderBy('r.created_at', 'DESC');
    const records = await qb.getMany();

    // Strip pregnancyId from output
    return records.map(({ pregnancyId, pregnancy, ...rest }) => rest);
  }

  // ── Stats ──

  async getStats() {
    const records = await this.repo.find();
    const total = records.length;
    if (total === 0) return { totalRecords: 0 };

    const byRegion: Record<string, number> = {};
    const byAgeGroup: Record<string, number> = {};
    const byDeliveryType: Record<string, number> = {};
    let gaSum = 0, gaCount = 0;
    const conditions: Record<string, number> = {
      gestationalDiabetes: 0, hypertension: 0, preeclampsia: 0,
      hellpSyndrome: 0, fgr: 0, pretermBirth: 0,
    };

    for (const r of records) {
      if (r.region) byRegion[r.region] = (byRegion[r.region] ?? 0) + 1;
      byAgeGroup[r.ageGroup] = (byAgeGroup[r.ageGroup] ?? 0) + 1;
      if (r.deliveryType) byDeliveryType[r.deliveryType] = (byDeliveryType[r.deliveryType] ?? 0) + 1;
      if (r.gaAtDelivery) { gaSum += r.gaAtDelivery; gaCount++; }
      if (r.gestationalDiabetes) conditions.gestationalDiabetes++;
      if (r.hypertension) conditions.hypertension++;
      if (r.preeclampsia) conditions.preeclampsia++;
      if (r.hellpSyndrome) conditions.hellpSyndrome++;
      if (r.fgr) conditions.fgr++;
      if (r.pretermBirth) conditions.pretermBirth++;
    }

    return {
      totalRecords: total,
      byRegion,
      byAgeGroup,
      conditionPrevalence: Object.fromEntries(
        Object.entries(conditions).map(([k, v]) => [k, { count: v, percent: Math.round((v / total) * 100) }]),
      ),
      deliveryTypes: byDeliveryType,
      averageGestationalAgeDays: gaCount > 0 ? Math.round(gaSum / gaCount) : null,
    };
  }

  // ── Export CSV ──

  async exportCsv(): Promise<string> {
    const records = await this.repo.find({ order: { createdAt: 'ASC' } });
    const headers = [
      'researchId', 'maternalAge', 'ageGroup', 'region', 'state', 'bloodType',
      'gravida', 'para', 'abortus', 'plurality', 'gaAtDelivery', 'deliveryType',
      'gestationalDiabetes', 'hypertension', 'preeclampsia', 'hellpSyndrome', 'fgr', 'pretermBirth',
    ];

    const rows = records.map((r) =>
      headers.map((h) => {
        const val = (r as any)[h];
        return val == null ? '' : String(val);
      }).join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }

  // ── Privados ──

  private generateResearchId(): string {
    return 'RES-' + randomBytes(8).toString('hex').toUpperCase();
  }

  private calculateAge(dateOfBirth: string | null): number {
    if (!dateOfBirth) return 0;
    const dob = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  }

  private getAgeGroup(age: number): AgeGroup {
    if (age < 20) return AgeGroup.AGE_15_19;
    if (age < 25) return AgeGroup.AGE_20_24;
    if (age < 30) return AgeGroup.AGE_25_29;
    if (age < 35) return AgeGroup.AGE_30_34;
    if (age < 40) return AgeGroup.AGE_35_39;
    return AgeGroup.AGE_40_PLUS;
  }

  private getRegionFromCep(partial: string | null): { region: string; state: string } | null {
    if (!partial || partial.length < 2) return null;
    return CEP_REGION_MAP[partial.substring(0, 2)] ?? CEP_REGION_MAP[partial.substring(0, 1)] ?? null;
  }

  private conditionToColumn(condition: string): string | null {
    const map: Record<string, string> = {
      gestational_diabetes: 'gestational_diabetes',
      hypertension: 'hypertension',
      preeclampsia: 'preeclampsia',
      hellp: 'hellp_syndrome',
      fgr: 'fgr',
      preterm: 'preterm_birth',
    };
    return map[condition] ?? null;
  }
}
