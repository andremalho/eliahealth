import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';

@Injectable()
export class PregnancyDashboardService {
  constructor(
    @InjectRepository(Pregnancy)
    private readonly pregnancyRepo: Repository<Pregnancy>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly pregnanciesService: PregnanciesService,
  ) {}

  async getDashboardSummary(pregnancyId: string) {
    // Single query to load pregnancy + patient
    const pregnancy = await this.pregnancyRepo.findOne({
      where: { id: pregnancyId },
      relations: ['patient'],
    });
    if (!pregnancy) {
      throw new NotFoundException(`Gestacao ${pregnancyId} nao encontrada`);
    }

    const patient = pregnancy.patient;
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);

    // Run all aggregate queries in parallel for performance
    const [
      countsRow,
      bpLastReadings,
      glucoseStats,
      glucoseDailyRows,
      examAlerts,
      copilotAlerts,
      vaccineCount,
      nextAppointment,
      onboardingProgress,
      lastWeight,
    ] = await Promise.all([
      // 1. Counts: consultations, ultrasounds, exams in a single query
      this.pregnancyRepo.query(
        `SELECT
           (SELECT COUNT(*)::int FROM consultations WHERE pregnancy_id = $1) AS consultations_count,
           (SELECT COUNT(*)::int FROM ultrasound_summaries WHERE pregnancy_id = $1) AS ultrasounds_count,
           (SELECT COUNT(*)::int FROM lab_results WHERE pregnancy_id = $1) AS exams_count`,
        [pregnancyId],
      ),

      // 2. Last 4 BP readings
      this.pregnancyRepo.query(
        `SELECT id, systolic, diastolic, heart_rate, reading_date, reading_time,
                status, alert_triggered, gestational_age_days
         FROM bp_readings
         WHERE pregnancy_id = $1
         ORDER BY reading_date DESC, reading_time DESC
         LIMIT 4`,
        [pregnancyId],
      ),

      // 3. Glucose stats
      this.pregnancyRepo.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status IN ('attention', 'critical'))::int AS altered
         FROM glucose_readings WHERE pregnancy_id = $1`,
        [pregnancyId],
      ),

      // 4. Last 3 days of glucose daily table
      this.pregnancyRepo.query(
        `SELECT reading_date, measurement_type, glucose_value, status
         FROM glucose_readings
         WHERE pregnancy_id = $1
           AND reading_date >= (
             SELECT COALESCE(MAX(reading_date) - interval '2 days', now()::date - interval '2 days')
             FROM glucose_readings WHERE pregnancy_id = $1
           )
         ORDER BY reading_date ASC, reading_time ASC`,
        [pregnancyId],
      ),

      // 5. Exam alerts (lab + ultrasound)
      this.pregnancyRepo.query(
        `(SELECT id, exam_name AS name, alert_message, 'lab' AS source
          FROM lab_results
          WHERE pregnancy_id = $1 AND alert_triggered = true
          ORDER BY result_date DESC LIMIT 5)
         UNION ALL
         (SELECT id, exam_type AS name, alert_message, 'ultrasound' AS source
          FROM ultrasound_summaries
          WHERE pregnancy_id = $1 AND alert_triggered = true
          ORDER BY exam_date DESC LIMIT 5)`,
        [pregnancyId],
      ),

      // 6. Copilot alerts (last 3)
      this.pregnancyRepo.query(
        `SELECT id, alert_type, message, severity, created_at
         FROM copilot_alerts
         WHERE pregnancy_id = $1 AND is_read = false
         ORDER BY created_at DESC LIMIT 3`,
        [pregnancyId],
      ).catch(() => []),

      // 7. Vaccine count (pending)
      this.pregnancyRepo.query(
        `SELECT COUNT(*)::int AS count
         FROM vaccines
         WHERE pregnancy_id = $1 AND status IN ('scheduled', 'pending', 'overdue')`,
        [pregnancyId],
      ),

      // 8. Next appointment
      this.pregnancyRepo.query(
        `SELECT next_appointment_date
         FROM consultations
         WHERE pregnancy_id = $1
           AND next_appointment_date >= CURRENT_DATE
         ORDER BY next_appointment_date ASC
         LIMIT 1`,
        [pregnancyId],
      ),

      // 9. Onboarding progress (if user-based — use patient owner)
      this.pregnancyRepo.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE is_completed = true)::int AS completed
         FROM onboarding_steps
         LIMIT 1`,
      ).catch(() => [{ total: 0, completed: 0 }]),

      // 10. Last weight from consultations
      this.pregnancyRepo.query(
        `SELECT weight_kg
         FROM consultations
         WHERE pregnancy_id = $1 AND weight_kg IS NOT NULL
         ORDER BY date DESC
         LIMIT 1`,
        [pregnancyId],
      ),
    ]);

    // ── Build response ──

    const counts = countsRow[0] ?? { consultations_count: 0, ultrasounds_count: 0, exams_count: 0 };
    const gStats = glucoseStats[0] ?? { total: 0, altered: 0 };
    const glucoseTotal = gStats.total;
    const glucoseAltered = gStats.altered;
    const vCount = vaccineCount[0]?.count ?? 0;
    const nextAppt = nextAppointment[0]?.next_appointment_date ?? null;
    const obProgress = onboardingProgress[0] ?? { total: 0, completed: 0 };
    const weight = lastWeight[0]?.weight_kg ? Number(lastWeight[0].weight_kg) : null;
    const heightM = patient.height ? Number(patient.height) / 100 : null;
    const bmi = weight && heightM ? Math.round((weight / (heightM * heightM)) * 10) / 10 : null;

    const initials = patient.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');

    // Build glucose daily table from raw rows
    const dailyTableMap = new Map<string, Record<string, { value: number; status: string }>>();
    for (const row of glucoseDailyRows) {
      const date = row.reading_date;
      if (!dailyTableMap.has(date)) dailyTableMap.set(date, {});
      dailyTableMap.get(date)![row.measurement_type] = {
        value: row.glucose_value,
        status: row.status,
      };
    }
    const lastDailyTable = Array.from(dailyTableMap.entries()).map(([date, readings]) => ({
      date,
      ...readings,
    }));

    const bpHasAlerts = bpLastReadings.some((r: any) => r.alert_triggered);

    return {
      patient: {
        name: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        avatarInitials: initials,
      },
      pregnancy: {
        gestationalAge: { weeks: ga.weeks, days: ga.days, totalDays: ga.totalDays },
        edd: pregnancy.edd,
        lmpDate: pregnancy.lmpDate,
        gaMethod: pregnancy.gaMethod,
        isHighRisk: pregnancy.isHighRisk,
        highRiskFlags: pregnancy.highRiskFlags,
        status: pregnancy.status,
        plurality: pregnancy.plurality,
      },
      obstetricHistory: {
        gravida: pregnancy.gravida,
        para: pregnancy.para,
        abortus: pregnancy.abortus,
        cesareans: pregnancy.cesareans,
        vaginalDeliveries: pregnancy.vaginalDeliveries,
      },
      alerts: {
        portalAccessPending: !patient.lgpdConsentAt,
        copilotAlerts: copilotAlerts,
        examAlerts: examAlerts,
      },
      bpSummary: {
        lastReadings: bpLastReadings.map((r: any) => ({
          systolic: r.systolic,
          diastolic: r.diastolic,
          heartRate: r.heart_rate,
          date: r.reading_date,
          time: r.reading_time,
          status: r.status,
          gestationalAgeDays: r.gestational_age_days,
        })),
        hasAlerts: bpHasAlerts,
        referenceLines: {
          hypertension: { systolic: 140, diastolic: 90 },
        },
      },
      glucoseSummary: {
        totalReadings: glucoseTotal,
        alteredPercentage: glucoseTotal > 0 ? Math.round((glucoseAltered / glucoseTotal) * 100) : 0,
        lastDailyTable,
      },
      profile: {
        bloodType: patient.bloodType,
        weight,
        height: patient.height ? Number(patient.height) : null,
        bmi,
      },
      vaccineCount: vCount,
      nextAppointment: nextAppt,
      consultationsCount: counts.consultations_count,
      ultrasoundsCount: counts.ultrasounds_count,
      examsCount: counts.exams_count,
      onboardingProgress: {
        completed: obProgress.completed,
        total: obProgress.total,
        percentage: obProgress.total > 0
          ? Math.round((obProgress.completed / obProgress.total) * 100)
          : 0,
      },
    };
  }
}
