import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Patient } from '../patients/patient.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { PublicShare } from './public-share.entity.js';
import { GuestAccess, GuestAccessType } from './guest-access.entity.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../audit/audit-log.entity.js';

@Injectable()
export class PortalDataService {
  constructor(
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Pregnancy) private readonly pregnancyRepo: Repository<Pregnancy>,
    @InjectRepository(PublicShare) private readonly shareRepo: Repository<PublicShare>,
    @InjectRepository(GuestAccess) private readonly guestRepo: Repository<GuestAccess>,
    private readonly pregnanciesService: PregnanciesService,
    private readonly auditService: AuditService,
  ) {}

  // ── Helpers ──

  private async getActivePregnancy(patientId: string): Promise<Pregnancy> {
    const pregnancy = await this.pregnancyRepo.findOne({
      where: { patientId, status: 'active' as any },
      order: { createdAt: 'DESC' },
    });
    if (!pregnancy) {
      // Fallback to latest pregnancy
      const latest = await this.pregnancyRepo.findOne({
        where: { patientId },
        order: { createdAt: 'DESC' },
      });
      if (!latest) throw new NotFoundException('Nenhuma gestacao encontrada');
      return latest;
    }
    return pregnancy;
  }

  private audit(patientId: string, resource: string, pregnancyId?: string) {
    this.auditService.log({
      userId: patientId,
      patientId,
      pregnancyId: pregnancyId ?? null,
      action: AuditAction.READ,
      resource: `portal:${resource}`,
      ipAddress: 'portal',
      responseStatus: 200,
    }).catch(() => {});
  }

  private getTrimester(gaDays: number): number {
    if (gaDays < 98) return 1;  // < 14 weeks
    if (gaDays < 196) return 2; // < 28 weeks
    return 3;
  }

  // ── MODULE 1: Dashboard ──

  async getDashboard(patientId: string) {
    const patient = await this.patientRepo.findOneBy({ id: patientId });
    if (!patient) throw new NotFoundException('Paciente nao encontrada');

    const pregnancy = await this.getActivePregnancy(patientId);
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);
    const progress = Math.min(100, Math.round((ga.totalDays / 280) * 100));

    const [counts, emergencyContacts] = await Promise.all([
      this.pregnancyRepo.query(
        `SELECT
           (SELECT COUNT(*)::int FROM consultations WHERE pregnancy_id = $1) AS consultations,
           (SELECT COUNT(*)::int FROM lab_results WHERE pregnancy_id = $1) AS exams,
           (SELECT COUNT(*)::int FROM ultrasound_summaries WHERE pregnancy_id = $1) AS ultrasounds`,
        [pregnancy.id],
      ),
      this.pregnancyRepo.query(
        `SELECT name, phone FROM emergency_contacts WHERE patient_id = $1 ORDER BY is_main_contact DESC`,
        [patientId],
      ),
    ]);

    this.audit(patientId, 'dashboard', pregnancy.id);

    return {
      patient: {
        name: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        profileCompletedAt: patient.profileCompletedAt ?? null,
      },
      pregnancy: {
        id: pregnancy.id,
        gestationalAge: { weeks: ga.weeks, days: ga.days },
        edd: pregnancy.edd,
        lmpDate: pregnancy.lmpDate,
        trimester: this.getTrimester(ga.totalDays),
        progress,
        isHighRisk: pregnancy.isHighRisk,
      },
      emergencyContacts,
      counts: counts[0] ?? { consultations: 0, exams: 0, ultrasounds: 0 },
    };
  }

  // ── MODULE 2: Consultations ──

  async getConsultations(patientId: string, page = 1, limit = 20) {
    const pregnancy = await this.getActivePregnancy(patientId);

    const [data, [countRow]] = await Promise.all([
      this.pregnancyRepo.query(
        `SELECT c.date, c.gestational_age_days, c.weight_kg, c.bp_systolic, c.bp_diastolic,
                c.fetal_heart_rate, c.fetal_movements, c.edema_grade, c.fundal_height_cm,
                c.fetal_presentation, c.subjective AS complaints, c.plan AS conduct,
                u.name AS physician_name
         FROM consultations c
         LEFT JOIN users u ON u.id = (SELECT prescribed_by FROM prescriptions WHERE pregnancy_id = c.pregnancy_id LIMIT 1)
         WHERE c.pregnancy_id = $1
         ORDER BY c.date DESC
         LIMIT $2 OFFSET $3`,
        [pregnancy.id, limit, (page - 1) * limit],
      ),
      this.pregnancyRepo.query(
        `SELECT COUNT(*)::int AS total FROM consultations WHERE pregnancy_id = $1`,
        [pregnancy.id],
      ),
    ]);

    const total = countRow?.total ?? 0;
    this.audit(patientId, 'consultations', pregnancy.id);

    return {
      data: data.map((c: any) => ({
        ...c,
        trimester: this.getTrimester(c.gestational_age_days),
      })),
      total, page, limit, totalPages: Math.ceil(total / limit),
    };
  }

  // ── MODULE 3: Blood Pressure ──

  async getBloodPressure(patientId: string) {
    const pregnancy = await this.getActivePregnancy(patientId);

    const readings = await this.pregnancyRepo.query(
      `SELECT id, reading_date AS date, reading_time AS time, gestational_age_days,
              systolic, diastolic, measurement_location AS location,
              measurement_method AS method,
              (systolic >= 140 OR diastolic >= 90) AS is_altered
       FROM bp_readings WHERE pregnancy_id = $1
       ORDER BY reading_date DESC, reading_time DESC`,
      [pregnancy.id],
    );

    const total = readings.length;
    const altered = readings.filter((r: any) => r.is_altered).length;

    this.audit(patientId, 'blood-pressure', pregnancy.id);

    return {
      readings,
      summary: { total, altered, percentAltered: total > 0 ? Math.round((altered / total) * 100) : 0 },
    };
  }

  async createBloodPressure(patientId: string, dto: { date: string; time: string; systolic: number; diastolic: number; location?: string; method?: string }) {
    const pregnancy = await this.getActivePregnancy(patientId);
    const ga = this.pregnanciesService.getGestationalAge(pregnancy, new Date(`${dto.date}T${dto.time}`));
    const isAltered = dto.systolic >= 140 || dto.diastolic >= 90;

    const status = isAltered
      ? (dto.systolic >= 160 || dto.diastolic >= 110 ? 'critical' : 'attention')
      : 'normal';

    const [reading] = await this.pregnancyRepo.query(
      `INSERT INTO bp_readings (pregnancy_id, reading_date, reading_time, reading_date_time, systolic, diastolic,
         gestational_age_days, status, alert_triggered, source, measurement_location, measurement_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'patient_app', $10, $11)
       RETURNING *`,
      [pregnancy.id, dto.date, dto.time, new Date(`${dto.date}T${dto.time}`),
       dto.systolic, dto.diastolic, ga.totalDays, status, isAltered,
       dto.location ?? 'home', dto.method ?? 'digital_arm'],
    );

    this.auditService.log({
      userId: patientId, patientId, pregnancyId: pregnancy.id,
      action: AuditAction.CREATE, resource: 'portal:blood-pressure',
      ipAddress: 'portal', responseStatus: 201,
    }).catch(() => {});

    return { ...reading, isAltered };
  }

  async getBloodPressureChart(patientId: string) {
    const pregnancy = await this.getActivePregnancy(patientId);

    const data = await this.pregnancyRepo.query(
      `SELECT reading_date AS date, systolic, diastolic,
              (systolic >= 140 OR diastolic >= 90) AS is_altered
       FROM bp_readings WHERE pregnancy_id = $1
       ORDER BY reading_date ASC, reading_time ASC`,
      [pregnancy.id],
    );

    this.audit(patientId, 'blood-pressure/chart', pregnancy.id);

    return {
      readings: data,
      hypertensionThreshold: { systolic: 140, diastolic: 90 },
    };
  }

  // ── MODULE 4: Glucose ──

  async getGlucose(patientId: string, startDate?: string, endDate?: string) {
    const pregnancy = await this.getActivePregnancy(patientId);

    let dateFilter = '';
    const params: unknown[] = [pregnancy.id];
    if (startDate && endDate) {
      dateFilter = ' AND reading_date BETWEEN $2 AND $3';
      params.push(startDate, endDate);
    }

    const readings = await this.pregnancyRepo.query(
      `SELECT reading_date, measurement_type, glucose_value, status, reading_time AS measured_at
       FROM glucose_readings WHERE pregnancy_id = $1${dateFilter}
       ORDER BY reading_date ASC, reading_time ASC`,
      params,
    );

    // Group by day
    const byDay = new Map<string, Record<string, { value: number; isAltered: boolean; measuredAt: string }>>();
    for (const r of readings) {
      if (!byDay.has(r.reading_date)) byDay.set(r.reading_date, {});
      byDay.get(r.reading_date)![r.measurement_type] = {
        value: r.glucose_value,
        isAltered: r.status !== 'normal',
        measuredAt: r.measured_at,
      };
    }

    const total = readings.length;
    const altered = readings.filter((r: any) => r.status !== 'normal').length;

    this.audit(patientId, 'glucose', pregnancy.id);

    return {
      data: Array.from(byDay.entries()).map(([date, cols]) => ({ date, ...cols })),
      summary: { total, altered, percentAltered: total > 0 ? Math.round((altered / total) * 100) : 0 },
    };
  }

  async createGlucose(patientId: string, dto: { date: string; mealType: string; value: number; measuredAt: string }) {
    const pregnancy = await this.getActivePregnancy(patientId);

    const thresholds: Record<string, number> = { fasting: 95, post_breakfast_1h: 140, post_lunch_1h: 140, post_dinner_1h: 140 };
    const threshold = thresholds[dto.mealType] ?? 140;
    const isAltered = dto.value > threshold;
    const status = dto.value < 60 ? 'critical' : (isAltered ? 'attention' : 'normal');

    const [reading] = await this.pregnancyRepo.query(
      `INSERT INTO glucose_readings (pregnancy_id, reading_date, reading_time, reading_date_time,
         measurement_type, glucose_value, status, alert_triggered, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'patient_app')
       RETURNING *`,
      [pregnancy.id, dto.date, dto.measuredAt, new Date(`${dto.date}T${dto.measuredAt}`),
       dto.mealType, dto.value, status, isAltered],
    );

    this.auditService.log({
      userId: patientId, patientId, pregnancyId: pregnancy.id,
      action: AuditAction.CREATE, resource: 'portal:glucose',
      ipAddress: 'portal', responseStatus: 201,
    }).catch(() => {});

    return { ...reading, isAltered };
  }

  // ── MODULE 5: Profile ──

  async getProfile(patientId: string) {
    const patient = await this.patientRepo.findOneBy({ id: patientId });
    if (!patient) throw new NotFoundException('Paciente nao encontrada');
    const pregnancy = await this.getActivePregnancy(patientId);

    const [lastConsultation] = await this.pregnancyRepo.query(
      `SELECT weight_kg FROM consultations WHERE pregnancy_id = $1 AND weight_kg IS NOT NULL ORDER BY date DESC LIMIT 1`,
      [pregnancy.id],
    );

    const height = patient.height ? Number(patient.height) : null;
    const currentWeight = lastConsultation?.weight_kg ? Number(lastConsultation.weight_kg) : null;
    const heightM = height ? height / 100 : null;
    const currentBmi = currentWeight && heightM ? Math.round((currentWeight / (heightM * heightM)) * 10) / 10 : null;

    this.audit(patientId, 'profile', pregnancy.id);

    return {
      bloodType: patient.bloodType,
      rhFactor: patient.bloodTypeRH,
      height,
      currentWeight,
      currentBmi,
    };
  }

  // ── MODULE 6: Vaccines ──

  async getVaccines(patientId: string) {
    const pregnancy = await this.getActivePregnancy(patientId);

    const vaccines = await this.pregnancyRepo.query(
      `SELECT vaccine_name, status, scheduled_date, administered_date, dose_number, next_dose_date
       FROM vaccines WHERE pregnancy_id = $1 ORDER BY scheduled_date ASC`,
      [pregnancy.id],
    );

    const statusLabels: Record<string, string> = {
      administered: 'Em dia', scheduled: 'Pendente', pending: 'Pendente',
      overdue: 'Atrasada', refused: 'Recusada', not_applicable: 'Nao se aplica',
    };

    this.audit(patientId, 'vaccines', pregnancy.id);

    return {
      administered: vaccines.filter((v: any) => v.status === 'administered').map((v: any) => ({ ...v, statusLabel: statusLabels[v.status] })),
      pending: vaccines.filter((v: any) => v.status !== 'administered').map((v: any) => ({ ...v, statusLabel: statusLabels[v.status] ?? v.status })),
    };
  }

  // ── MODULE 7: Vaginal Swabs ──

  async getVaginalSwabs(patientId: string) {
    const pregnancy = await this.getActivePregnancy(patientId);

    const swabs = await this.pregnancyRepo.query(
      `SELECT exam_type, collection_date, result, status FROM vaginal_swabs
       WHERE pregnancy_id = $1 ORDER BY collection_date DESC`,
      [pregnancy.id],
    );

    const statusLabels: Record<string, string> = {
      pending: 'Aguardando resultado', normal: 'Normal',
      altered: 'Requer atencao', critical: 'Converse com seu medico sobre este resultado',
    };

    this.audit(patientId, 'vaginal-swabs', pregnancy.id);

    return swabs.map((s: any) => ({
      examType: s.exam_type,
      collectionDate: s.collection_date,
      result: s.status === 'critical' ? null : s.result,
      statusLabel: statusLabels[s.status] ?? s.status,
    }));
  }

  // ── MODULE 8: Lab Results ──

  async getLabResults(patientId: string, page = 1, limit = 20) {
    const pregnancy = await this.getActivePregnancy(patientId);

    const [data, [countRow]] = await Promise.all([
      this.pregnancyRepo.query(
        `SELECT exam_name, result_date AS collection_date, value, unit,
                CONCAT(reference_min, ' - ', reference_max) AS reference_range,
                status
         FROM lab_results WHERE pregnancy_id = $1
         ORDER BY result_date DESC
         LIMIT $2 OFFSET $3`,
        [pregnancy.id, limit, (page - 1) * limit],
      ),
      this.pregnancyRepo.query(
        `SELECT COUNT(*)::int AS total FROM lab_results WHERE pregnancy_id = $1`,
        [pregnancy.id],
      ),
    ]);

    const statusLabels: Record<string, string> = {
      pending: 'Aguardando', normal: 'Normal', attention: 'Alterado', critical: 'Critico',
    };

    const total = countRow?.total ?? 0;
    this.audit(patientId, 'lab-results', pregnancy.id);

    return {
      data: data.map((r: any) => ({ ...r, statusLabel: statusLabels[r.status] ?? r.status })),
      total, page, limit, totalPages: Math.ceil(total / limit),
    };
  }

  // ── MODULE 9: Ultrasounds ──

  async getUltrasounds(patientId: string) {
    const pregnancy = await this.getActivePregnancy(patientId);

    const ultrasounds = await this.pregnancyRepo.query(
      `SELECT exam_date, gestational_age_days, exam_type, general_observations AS summary, attachment_url
       FROM ultrasound_summaries WHERE pregnancy_id = $1
       ORDER BY exam_date DESC`,
      [pregnancy.id],
    );

    this.audit(patientId, 'ultrasounds', pregnancy.id);

    return ultrasounds;
  }

  // ── MODULE 10: Public Share ──

  async createPublicShare(patientId: string, expiresAt: string) {
    const pregnancy = await this.getActivePregnancy(patientId);
    return this.persistShare(pregnancy.id, patientId, expiresAt);
  }

  async createPublicShareForPregnancy(pregnancyId: string, expiresAt?: string) {
    const pregnancy = await this.pregnancyRepo.findOneBy({ id: pregnancyId });
    if (!pregnancy) throw new NotFoundException('Gestacao nao encontrada');
    return this.persistShare(pregnancyId, pregnancy.patientId, expiresAt);
  }

  private async persistShare(pregnancyId: string, patientId: string, expiresAt?: string) {
    const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const defaultExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expDate = expiresAt ? new Date(expiresAt) : defaultExp;
    if (expDate > maxDate) {
      throw new BadRequestException('Expiracao maxima: 30 dias');
    }

    const share = this.shareRepo.create({
      pregnancyId,
      patientId,
      shareToken: randomUUID(),
      expiresAt: expDate,
    });
    const saved = await this.shareRepo.save(share);

    const baseUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:5173';
    return {
      shareToken: saved.shareToken,
      shareUrl: `${baseUrl}/cartao?token=${saved.shareToken}`,
      qrCodeData: `${baseUrl}/cartao?token=${saved.shareToken}`,
      expiresAt: saved.expiresAt,
    };
  }

  async getPublicShareData(shareToken: string, ipAddress?: string) {
    const share = await this.shareRepo.findOneBy({ shareToken });
    if (!share || share.revoked) throw new NotFoundException('Link invalido ou revogado');
    if (new Date() > share.expiresAt) throw new ForbiddenException('Link expirado');

    // Increment access count
    share.accessCount++;
    await this.shareRepo.save(share);

    // Audit public access
    this.auditService.log({
      patientId: share.patientId,
      pregnancyId: share.pregnancyId,
      action: AuditAction.READ,
      resource: 'portal:public-share',
      ipAddress: ipAddress ?? 'unknown',
      responseStatus: 200,
      requestData: { shareToken },
    }).catch(() => {});

    // Return safe read-only data (NO glucose, BP, swabs)
    const pregnancy = await this.pregnancyRepo.findOne({
      where: { id: share.pregnancyId },
      relations: ['patient'],
    });
    if (!pregnancy) throw new NotFoundException('Gestacao nao encontrada');

    const patient = pregnancy.patient;
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);

    const [consultations, vaccines] = await Promise.all([
      this.pregnancyRepo.query(
        `SELECT date, gestational_age_days, weight_kg, bp_systolic, bp_diastolic,
                fetal_heart_rate, fundal_height_cm
         FROM consultations WHERE pregnancy_id = $1 ORDER BY date DESC LIMIT 10`,
        [share.pregnancyId],
      ),
      this.pregnancyRepo.query(
        `SELECT vaccine_name, status, administered_date FROM vaccines WHERE pregnancy_id = $1`,
        [share.pregnancyId],
      ),
    ]);

    return {
      patient: { name: patient.fullName },
      pregnancy: {
        gestationalAge: { weeks: ga.weeks, days: ga.days },
        edd: pregnancy.edd,
        trimester: this.getTrimester(ga.totalDays),
        isHighRisk: pregnancy.isHighRisk,
      },
      profile: { bloodType: patient.bloodType },
      consultations,
      vaccines: vaccines.map((v: any) => ({
        vaccineName: v.vaccine_name,
        status: v.status === 'administered' ? 'Em dia' : 'Pendente',
      })),
    };
  }

  async revokePublicShare(patientId: string, shareToken: string) {
    const share = await this.shareRepo.findOneBy({ shareToken, patientId });
    if (!share) throw new NotFoundException('Link nao encontrado');
    share.revoked = true;
    await this.shareRepo.save(share);
    return { revoked: true };
  }

  async listPublicShares(patientId: string) {
    return this.shareRepo.find({
      where: { patientId, revoked: false },
      order: { createdAt: 'DESC' },
    });
  }

  // ── GUESTS ──

  async createGuestAccess(patientId: string, dto: {
    inviteMethod: string; inviteContact: string; accessType?: string;
    showWeightChart?: boolean; expiresAt?: string;
  }) {
    const pregnancy = await this.getActivePregnancy(patientId);

    const guest = this.guestRepo.create({
      pregnancyId: pregnancy.id,
      grantedBy: patientId,
      inviteMethod: dto.inviteMethod as any,
      inviteContact: dto.inviteContact,
      accessType: (dto.accessType ?? 'readonly') as any,
      showWeightChart: dto.showWeightChart ?? false,
      accessToken: randomUUID(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    const saved = await this.guestRepo.save(guest);

    this.auditService.log({
      userId: patientId, patientId, pregnancyId: pregnancy.id,
      action: AuditAction.SHARE, resource: 'portal:guests',
      ipAddress: 'portal', responseStatus: 201,
    }).catch(() => {});

    const baseUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:5173';
    return { ...saved, accessUrl: `${baseUrl}/convidado?token=${saved.accessToken}` };
  }

  async listGuests(patientId: string) {
    const pregnancy = await this.getActivePregnancy(patientId);
    return this.guestRepo.find({
      where: { pregnancyId: pregnancy.id, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeGuestAccess(patientId: string, guestId: string) {
    const guest = await this.guestRepo.findOneBy({ id: guestId, grantedBy: patientId });
    if (!guest) throw new NotFoundException('Convidado nao encontrado');
    guest.isActive = false;
    guest.revokedAt = new Date();
    return this.guestRepo.save(guest);
  }

  async getGuestData(accessToken: string, ipAddress?: string) {
    const guest = await this.guestRepo.findOneBy({ accessToken, isActive: true });
    if (!guest) throw new NotFoundException('Link invalido ou revogado');
    if (guest.expiresAt && new Date() > guest.expiresAt) throw new ForbiddenException('Acesso expirado');

    if (!guest.acceptedAt) {
      guest.acceptedAt = new Date();
      await this.guestRepo.save(guest);
    }

    this.auditService.log({
      patientId: guest.grantedBy, pregnancyId: guest.pregnancyId,
      action: AuditAction.READ, resource: 'portal:guest-view',
      ipAddress: ipAddress ?? 'unknown', responseStatus: 200,
      requestData: { accessToken, accessType: guest.accessType },
    }).catch(() => {});

    const pregnancy = await this.pregnancyRepo.findOne({
      where: { id: guest.pregnancyId }, relations: ['patient'],
    });
    if (!pregnancy) throw new NotFoundException('Gestacao nao encontrada');

    const ga = this.pregnanciesService.getGestationalAge(pregnancy);
    const [consultations, vaccines] = await Promise.all([
      this.pregnancyRepo.query(
        `SELECT date, weight_kg, bp_systolic, bp_diastolic, fetal_heart_rate
         FROM consultations WHERE pregnancy_id = $1 ORDER BY date DESC LIMIT 10`,
        [guest.pregnancyId],
      ),
      this.pregnancyRepo.query(
        `SELECT vaccine_name, status FROM vaccines WHERE pregnancy_id = $1`,
        [guest.pregnancyId],
      ),
    ]);

    const result: Record<string, unknown> = {
      patient: { name: pregnancy.patient.fullName },
      pregnancy: { gestationalAge: { weeks: ga.weeks, days: ga.days }, edd: pregnancy.edd, trimester: this.getTrimester(ga.totalDays) },
      consultations,
      vaccines,
      accessType: guest.accessType,
    };

    if (guest.showWeightChart) {
      result.weightChart = consultations
        .filter((c: any) => c.weight_kg)
        .map((c: any) => ({ date: c.date, weight: c.weight_kg }));
    }

    return result;
  }

  // ── PATIENT EXAMS ──

  async createPatientExam(patientId: string, dto: {
    examName: string; examDate: string; result?: string; unit?: string;
    referenceRange?: string; labName?: string; attachmentUrl?: string;
  }) {
    const pregnancy = await this.getActivePregnancy(patientId);

    const [exam] = await this.pregnancyRepo.query(
      `INSERT INTO lab_results (pregnancy_id, exam_name, exam_category, requested_at, value, unit, reference_text, lab_name, attachment_url, source, review_status)
       VALUES ($1, $2, 'other', $3, $4, $5, $6, $7, $8, 'patient_upload', 'pending_review')
       RETURNING *`,
      [pregnancy.id, dto.examName, dto.examDate, dto.result ?? null, dto.unit ?? null,
       dto.referenceRange ?? null, dto.labName ?? null, dto.attachmentUrl ?? null],
    );

    this.auditService.log({
      userId: patientId, patientId, pregnancyId: pregnancy.id,
      action: AuditAction.CREATE, resource: 'portal:patient-exams',
      ipAddress: 'portal', responseStatus: 201,
    }).catch(() => {});

    return exam;
  }

  async listPatientExams(patientId: string) {
    const pregnancy = await this.getActivePregnancy(patientId);
    return this.pregnancyRepo.query(
      `SELECT id, exam_name, requested_at AS exam_date, value, unit, status, review_status, lab_name
       FROM lab_results WHERE pregnancy_id = $1 AND source = 'patient_upload'
       ORDER BY requested_at DESC`,
      [pregnancy.id],
    );
  }

  async deletePatientExam(patientId: string, examId: string) {
    const pregnancy = await this.getActivePregnancy(patientId);
    const [exam] = await this.pregnancyRepo.query(
      `SELECT id, review_status FROM lab_results WHERE id = $1 AND pregnancy_id = $2 AND source = 'patient_upload'`,
      [examId, pregnancy.id],
    );
    if (!exam) throw new NotFoundException('Exame nao encontrado');
    if (exam.review_status === 'confirmed') throw new BadRequestException('Exame ja confirmado pelo medico');
    await this.pregnancyRepo.query(`DELETE FROM lab_results WHERE id = $1`, [examId]);
    return { deleted: true };
  }

  // ── DOCTOR EXAM REVIEW ──

  async listPendingPatientExams(pregnancyId: string) {
    return this.pregnancyRepo.query(
      `SELECT id, exam_name, requested_at AS exam_date, value, unit, reference_text,
              lab_name, attachment_url, review_status, source, created_at
       FROM lab_results
       WHERE pregnancy_id = $1 AND source = 'patient_upload'
       ORDER BY created_at DESC`,
      [pregnancyId],
    );
  }

  async reviewPatientExam(examId: string, status: 'confirmed' | 'rejected', notes?: string) {
    const [exam] = await this.pregnancyRepo.query(
      `SELECT id, review_status FROM lab_results WHERE id = $1 AND source = 'patient_upload'`,
      [examId],
    );
    if (!exam) throw new NotFoundException('Exame nao encontrado');

    await this.pregnancyRepo.query(
      `UPDATE lab_results SET review_status = $1, notes = COALESCE($2, notes), reviewed_at = NOW() WHERE id = $3`,
      [status, notes ?? null, examId],
    );

    return { id: examId, reviewStatus: status };
  }
}
