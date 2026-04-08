import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Pregnancy } from './pregnancy.entity.js';
import { GaMethod, IvfTransferType, PregnancyStatus } from './pregnancy.enums.js';
import { PregnancyShare } from '../teams/pregnancy-share.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { PatientVerificationService } from '../patient-verification/patient-verification.service.js';
import { CreatePregnancyDto } from './dto/create-pregnancy.dto.js';
import { UpdatePregnancyDto } from './dto/update-pregnancy.dto.js';
import { QuickCreatePregnancyDto } from './dto/quick-create-pregnancy.dto.js';

export interface PregnancyListFilters {
  status?: string;
  sort?: string;
  ownership?: string;
  search?: string;
  userId?: string;
}

const STATUS_ALIASES: Record<string, PregnancyStatus> = {
  born: PregnancyStatus.COMPLETED,
  desisted: PregnancyStatus.INTERRUPTED,
};

@Injectable()
export class PregnanciesService {
  constructor(
    @InjectRepository(Pregnancy)
    private readonly repo: Repository<Pregnancy>,
    @InjectRepository(PregnancyShare)
    private readonly shareRepo: Repository<PregnancyShare>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly verificationService: PatientVerificationService,
  ) {}

  private static readonly IVF_OFFSET: Record<string, number> = {
    [IvfTransferType.D3]: 17,
    [IvfTransferType.D5]: 19,
    [IvfTransferType.BLASTOCYST]: 19,
    [IvfTransferType.NATURAL_CYCLE]: 14,
  };

  async create(patientId: string, dto: CreatePregnancyDto): Promise<Pregnancy> {
    this.resolveInputDates(dto);
    const edd = this.calculateEdd(dto);
    const pregnancy = this.repo.create({
      ...dto,
      patientId,
      edd,
      lmpDate: dto.lmpDate!,
    });
    return this.repo.save(pregnancy);
  }

  async quickCreate(dto: QuickCreatePregnancyDto) {
    let patient: Patient | null = null;

    if (dto.email) {
      patient = await this.patientRepo.findOneBy({ email: dto.email });
    }
    if (!patient && dto.phone) {
      patient = await this.patientRepo.findOneBy({ phone: dto.phone });
    }

    if (!patient) {
      patient = this.patientRepo.create({
        fullName: dto.patientName,
        cpf: dto.cpf ?? this.generateTempCpf(),
        email: dto.email,
        phone: dto.phone,
      });
      patient = await this.patientRepo.save(patient);
    }

    const pregDto: CreatePregnancyDto = {
      gaMethod: dto.gaMethod,
      lmpDate: dto.lmpDate,
      edd: dto.edd,
      gaWeeks: dto.gaWeeks,
      gaDays: dto.gaDays,
      ivfTransferDate: dto.ivfTransferDate,
      ivfTransferType: dto.ivfTransferType,
      usDatingDate: dto.usDatingDate,
      usDatingGaDays: dto.usDatingGaDays,
      gravida: dto.gravida ?? 1,
      para: dto.para ?? 0,
      abortus: dto.abortus ?? 0,
    };

    const pregnancy = await this.create(patient.id, pregDto);

    let verificationEmailSent = false;
    if (dto.email) {
      try {
        await this.verificationService.sendVerificationEmail(patient.id);
        verificationEmailSent = true;
      } catch {
        // Non-critical — patient can be verified later
      }
    }

    return { patient, pregnancy, verificationEmailSent };
  }

  private generateTempCpf(): string {
    const rand = Math.floor(Math.random() * 99999999999)
      .toString()
      .padStart(11, '0');
    return rand;
  }

  async findAllByPatient(
    patientId: string,
    filters: PregnancyListFilters = {},
  ): Promise<Pregnancy[]> {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.patient', 'patient')
      .where('p.patient_id = :patientId', { patientId });

    this.applyStatusFilter(qb, filters.status);
    this.applySorting(qb, filters.sort);

    return qb.getMany();
  }

  async findOne(id: string, tenantId?: string | null): Promise<Pregnancy> {
    const pregnancy = await this.repo.findOneBy({ id });
    if (!pregnancy) {
      throw new NotFoundException(`Gestacao ${id} nao encontrada`);
    }
    if (tenantId) {
      const patient = await this.patientRepo.findOneBy({ id: pregnancy.patientId });
      if (patient && patient.tenantId !== tenantId) {
        throw new ForbiddenException('Acesso negado');
      }
    }
    return pregnancy;
  }

  async findOneWithStats(id: string, tenantId?: string | null) {
    const pregnancy = await this.findOne(id, tenantId);
    const ga = this.getGestationalAge(pregnancy);

    const [bpStats] = await this.repo.query(
      `SELECT COUNT(*)::int AS count FROM bp_readings WHERE pregnancy_id = $1`,
      [id],
    );

    const [glucoseStats] = await this.repo.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status IN ('attention', 'critical'))::int AS altered
       FROM glucose_readings WHERE pregnancy_id = $1`,
      [id],
    );

    const bpReadingsCount: number = bpStats?.count ?? 0;
    const glucoseTotal: number = glucoseStats?.total ?? 0;
    const glucoseAltered: number = glucoseStats?.altered ?? 0;
    const glucoseAlteredPercentage =
      glucoseTotal > 0 ? Math.round((glucoseAltered / glucoseTotal) * 100) : 0;

    return {
      ...pregnancy,
      gestationalAge: { weeks: ga.weeks, days: ga.days, totalDays: ga.totalDays },
      bpReadingsCount,
      glucoseReadingsCount: glucoseTotal,
      glucoseAlteredPercentage,
    };
  }

  async getTimeline(id: string, tenantId?: string | null) {
    await this.findOne(id, tenantId);

    const [consultations, ultrasounds, labs, vaccines, prescriptions, alerts] = await Promise.all([
      this.repo.query(
        `SELECT id, date, gestational_age_days, weight_kg, bp_systolic, bp_diastolic, fetal_heart_rate, fundal_height_cm, subjective
         FROM consultations WHERE pregnancy_id = $1 ORDER BY date DESC`,
        [id],
      ),
      this.repo.query(
        `SELECT id, exam_type, exam_date, final_report
         FROM ultrasounds WHERE pregnancy_id = $1 ORDER BY exam_date DESC`,
        [id],
      ).catch(() => []),
      this.repo.query(
        `SELECT id, exam_name, exam_category, value, unit, reference_min, reference_max, status, result_date, requested_at
         FROM lab_results WHERE pregnancy_id = $1 ORDER BY COALESCE(result_date, requested_at) DESC`,
        [id],
      ).catch(() => []),
      this.repo.query(
        `SELECT id, vaccine_name, status, administered_date, scheduled_date, dose_number
         FROM vaccines WHERE pregnancy_id = $1 ORDER BY COALESCE(administered_date, scheduled_date) DESC NULLS LAST`,
        [id],
      ).catch(() => []),
      this.repo.query(
        `SELECT id, prescription_date, status, medications, notes
         FROM prescriptions WHERE pregnancy_id = $1 ORDER BY prescription_date DESC`,
        [id],
      ).catch(() => []),
      this.repo.query(
        `SELECT id, title, message, severity, alert_type, created_at
         FROM copilot_alerts WHERE pregnancy_id = $1 ORDER BY created_at DESC LIMIT 30`,
        [id],
      ).catch(() => []),
    ]);

    const events: any[] = [];

    for (const c of consultations) {
      events.push({
        id: c.id,
        type: 'consultation',
        date: c.date,
        title: 'Consulta',
        gestationalAgeDays: c.gestational_age_days,
        details: {
          weightKg: c.weight_kg,
          bpSystolic: c.bp_systolic,
          bpDiastolic: c.bp_diastolic,
          fetalHeartRate: c.fetal_heart_rate,
          fundalHeightCm: c.fundal_height_cm,
          subjective: c.subjective,
        },
      });
    }

    for (const u of ultrasounds) {
      events.push({
        id: u.id,
        type: 'ultrasound',
        date: u.exam_date,
        title: 'Ultrassonografia',
        details: { examType: u.exam_type, finalReport: u.final_report },
      });
    }

    for (const l of labs) {
      events.push({
        id: l.id,
        type: 'lab_result',
        date: l.result_date ?? l.requested_at,
        title: l.exam_name ?? 'Exame laboratorial',
        details: {
          examCategory: l.exam_category,
          value: l.value,
          unit: l.unit,
          referenceMin: l.reference_min,
          referenceMax: l.reference_max,
          status: l.status,
        },
      });
    }

    for (const v of vaccines) {
      const date = v.administered_date ?? v.scheduled_date;
      if (!date) continue;
      events.push({
        id: v.id,
        type: 'vaccine',
        date,
        title: v.vaccine_name ?? 'Vacina',
        details: { status: v.status, doseNumber: v.dose_number },
      });
    }

    for (const p of prescriptions) {
      events.push({
        id: p.id,
        type: 'prescription',
        date: p.prescription_date,
        title: 'Prescrição',
        details: {
          status: p.status,
          medications: p.medications,
          notes: p.notes,
        },
      });
    }

    for (const a of alerts) {
      events.push({
        id: a.id,
        type: 'alert',
        date: a.created_at,
        title: a.title ?? 'Alerta do copiloto',
        details: {
          message: a.message,
          severity: a.severity,
          alertType: a.alert_type,
        },
      });
    }

    return events.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return db - da;
    });
  }

  async update(id: string, dto: UpdatePregnancyDto, tenantId?: string | null): Promise<Pregnancy> {
    const pregnancy = await this.findOne(id, tenantId);
    Object.assign(pregnancy, dto);

    if (dto.lmpDate || dto.gaMethod || dto.usDatingDate || dto.usDatingGaDays !== undefined) {
      pregnancy.edd = this.calculateEdd(pregnancy);
    }

    return this.repo.save(pregnancy);
  }

  async completeInitialAssessment(
    id: string,
    dto: UpdatePregnancyDto,
    tenantId?: string | null,
  ): Promise<Pregnancy> {
    const pregnancy = await this.findOne(id, tenantId);
    Object.assign(pregnancy, dto);
    pregnancy.firstConsultationCompletedAt = new Date();

    // Auto-classifica alto risco baseado em patologias críticas
    const criticalFlags: string[] = [];
    const path = (pregnancy.currentPathologies ?? '').toLowerCase();
    if (/hipertens/.test(path)) criticalFlags.push('hipertensao');
    if (/diabetes|dm[12]|lada|mody/.test(path)) criticalFlags.push('diabetes');
    if (/trombofil/.test(path)) criticalFlags.push('trombofilia');
    if (criticalFlags.length > 0) {
      pregnancy.isHighRisk = true;
      pregnancy.highRiskFlags = Array.from(
        new Set([...(pregnancy.highRiskFlags ?? []), ...criticalFlags]),
      );
    }

    return this.repo.save(pregnancy);
  }

  getGestationalAge(pregnancy: Pregnancy, referenceDate: Date = new Date()) {
    let gaDays: number;

    if (
      pregnancy.gaMethod === GaMethod.IVF &&
      pregnancy.ivfTransferDate &&
      pregnancy.ivfTransferType
    ) {
      const transferDate = new Date(pregnancy.ivfTransferDate);
      const daysSinceTransfer = Math.floor(
        (referenceDate.getTime() - transferDate.getTime()) / 86_400_000,
      );
      const offset =
        PregnanciesService.IVF_OFFSET[pregnancy.ivfTransferType] ?? 14;
      gaDays = daysSinceTransfer + offset;
    } else if (
      pregnancy.gaMethod === GaMethod.ULTRASOUND &&
      pregnancy.usDatingGaDays != null &&
      pregnancy.usDatingDate
    ) {
      const usDate = new Date(pregnancy.usDatingDate);
      const daysSinceUs = Math.floor(
        (referenceDate.getTime() - usDate.getTime()) / 86_400_000,
      );
      gaDays = pregnancy.usDatingGaDays + daysSinceUs;
    } else {
      const lmp = new Date(pregnancy.lmpDate);
      gaDays = Math.floor(
        (referenceDate.getTime() - lmp.getTime()) / 86_400_000,
      );
    }

    return {
      weeks: Math.floor(gaDays / 7),
      days: gaDays % 7,
      totalDays: gaDays,
      edd: pregnancy.edd,
    };
  }

  async list(filters: PregnancyListFilters) {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.patient', 'patient');

    this.applyStatusFilter(qb, filters.status);

    if (filters.search) {
      qb.andWhere('patient.full_name ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.userId && filters.ownership && filters.ownership !== 'all') {
      if (filters.ownership === 'shared') {
        qb.innerJoin(
          PregnancyShare,
          'ps',
          'ps.pregnancy_id = p.id AND ps.shared_with = :userId',
          { userId: filters.userId },
        );
      } else if (filters.ownership === 'mine') {
        qb.andWhere(
          `p.id NOT IN (
            SELECT ps2.pregnancy_id FROM pregnancy_shares ps2
            WHERE ps2.shared_with = :userId
          )`,
          { userId: filters.userId },
        );
      }
    }

    this.applySorting(qb, filters.sort ?? 'ga_desc');

    const pregnancies = await qb.getMany();
    const now = new Date();

    return pregnancies.map((preg) => {
      const ga = this.getGestationalAge(preg, now);
      return {
        id: preg.id,
        patientId: preg.patientId,
        patientName: preg.patient?.fullName ?? null,
        gestationalAge: { weeks: ga.weeks, days: ga.days },
        edd: preg.edd,
        status: preg.status,
        riskLevel: preg.isHighRisk ? 'high' : 'low',
        highRiskFlags: preg.highRiskFlags,
      };
    });
  }

  private applyStatusFilter(
    qb: SelectQueryBuilder<Pregnancy>,
    status?: string,
  ) {
    if (!status) return;
    const resolved = STATUS_ALIASES[status] ?? status;
    qb.andWhere('p.status = :status', { status: resolved });
  }

  private applySorting(
    qb: SelectQueryBuilder<Pregnancy>,
    sort?: string,
  ) {
    switch (sort) {
      case 'ga_asc':
        // Smallest GA first = most recent LMP
        qb.orderBy('p.lmp_date', 'DESC');
        break;
      case 'ga_desc':
        // Largest GA first = earliest LMP
        qb.orderBy('p.lmp_date', 'ASC');
        break;
      case 'name_asc':
        qb.orderBy('patient.full_name', 'ASC');
        break;
      case 'name_desc':
        qb.orderBy('patient.full_name', 'DESC');
        break;
      default:
        qb.orderBy('p.created_at', 'DESC');
        break;
    }
  }

  private resolveInputDates(dto: CreatePregnancyDto): void {
    const now = new Date();

    // If gaWeeks/gaDays provided, compute retroactive LMP
    if (dto.gaWeeks != null || dto.gaDays != null) {
      const totalDays = (dto.gaWeeks ?? 0) * 7 + (dto.gaDays ?? 0);
      const lmp = new Date(now.getTime() - totalDays * 86_400_000);
      dto.lmpDate = lmp.toISOString().split('T')[0];
      dto.gaMethod = GaMethod.LMP;
      return;
    }

    // If only EDD provided, compute retroactive LMP
    if (!dto.lmpDate && dto.edd) {
      const eddDate = new Date(dto.edd);
      const lmp = new Date(eddDate.getTime() - 280 * 86_400_000);
      dto.lmpDate = lmp.toISOString().split('T')[0];
      return;
    }

    // Ultrasound dating: compute retroactive LMP from us date + GA at exam
    if (
      dto.gaMethod === GaMethod.ULTRASOUND &&
      dto.usDatingDate &&
      dto.usDatingGaDays != null &&
      !dto.lmpDate
    ) {
      const usDate = new Date(dto.usDatingDate);
      const lmp = new Date(usDate.getTime() - dto.usDatingGaDays * 86_400_000);
      dto.lmpDate = lmp.toISOString().split('T')[0];
      return;
    }

    // IVF with transfer date: compute equivalent LMP
    if (
      dto.gaMethod === GaMethod.IVF &&
      dto.ivfTransferDate &&
      dto.ivfTransferType &&
      !dto.lmpDate
    ) {
      const offset =
        PregnanciesService.IVF_OFFSET[dto.ivfTransferType] ?? 14;
      const transferDate = new Date(dto.ivfTransferDate);
      const lmp = new Date(
        transferDate.getTime() - offset * 86_400_000,
      );
      dto.lmpDate = lmp.toISOString().split('T')[0];
      return;
    }
  }

  private calculateEdd(
    data: {
      lmpDate?: string;
      gaMethod: GaMethod;
      usDatingDate?: string | null;
      usDatingGaDays?: number | null;
      ivfTransferDate?: string | null;
      ivfTransferType?: string | null;
    },
  ): string {
    if (
      data.gaMethod === GaMethod.ULTRASOUND &&
      data.usDatingGaDays != null &&
      data.usDatingDate
    ) {
      const usDate = new Date(data.usDatingDate);
      const remainingDays = 280 - data.usDatingGaDays;
      const edd = new Date(usDate.getTime() + remainingDays * 86_400_000);
      return edd.toISOString().split('T')[0];
    }

    if (
      data.gaMethod === GaMethod.IVF &&
      data.ivfTransferDate &&
      data.ivfTransferType
    ) {
      const offset =
        PregnanciesService.IVF_OFFSET[data.ivfTransferType] ?? 14;
      const transferDate = new Date(data.ivfTransferDate);
      const gaDaysAtTransfer = offset;
      const remainingDays = 280 - gaDaysAtTransfer;
      const edd = new Date(
        transferDate.getTime() + remainingDays * 86_400_000,
      );
      return edd.toISOString().split('T')[0];
    }

    // LMP: DPP = DUM + 280 dias
    const lmp = new Date(data.lmpDate!);
    const edd = new Date(lmp.getTime() + 280 * 86_400_000);
    return edd.toISOString().split('T')[0];
  }
}
