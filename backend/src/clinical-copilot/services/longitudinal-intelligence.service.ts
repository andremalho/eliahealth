import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LongitudinalAlert } from '../entities/longitudinal-alert.entity.js';
import { CopilotCheckItem } from '../entities/copilot-check-item.entity.js';
import { Consultation } from '../../consultations/consultation.entity.js';
import { Pregnancy } from '../../pregnancies/pregnancy.entity.js';
import { Patient } from '../../patients/patient.entity.js';

@Injectable()
export class LongitudinalIntelligenceService {
  private readonly logger = new Logger(LongitudinalIntelligenceService.name);

  constructor(
    @InjectRepository(LongitudinalAlert)
    private readonly alertRepo: Repository<LongitudinalAlert>,
    @InjectRepository(CopilotCheckItem)
    private readonly checkItemRepo: Repository<CopilotCheckItem>,
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    @InjectRepository(Pregnancy)
    private readonly pregnancyRepo: Repository<Pregnancy>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async analyzeForTenant(tenantId: string): Promise<void> {
    await Promise.all([
      this.checkMissedFollowups(tenantId),
      this.checkPendingExams(tenantId),
      this.analyzeCopilotTrends(tenantId),
    ]);
  }

  // ── Pacientes que nao retornaram ──

  private async checkMissedFollowups(tenantId: string): Promise<void> {
    try {
      const missed: any[] = await this.consultationRepo.query(
        `SELECT c.id, c.date, c.next_appointment_date, c.pregnancy_id,
                p.full_name AS patient_name, p.id AS patient_id, p.tenant_id,
                preg.patient_id AS preg_patient_id
         FROM consultations c
         JOIN pregnancies preg ON preg.id = c.pregnancy_id
         JOIN patients p ON p.id = preg.patient_id
         WHERE c.next_appointment_date IS NOT NULL
           AND c.next_appointment_date < CURRENT_DATE - INTERVAL '3 days'
           AND p.tenant_id = $1
           AND NOT EXISTS (
             SELECT 1 FROM consultations c2
             WHERE c2.pregnancy_id = c.pregnancy_id
               AND c2.date > c.date
           )
           AND NOT EXISTS (
             SELECT 1 FROM longitudinal_alerts la
             WHERE la.patient_id = p.id
               AND la.alert_type = 'missed_followup'
               AND la.created_at > CURRENT_DATE - INTERVAL '7 days'
           )
         LIMIT 50`,
        [tenantId],
      );

      for (const row of missed) {
        const daysSince = Math.floor(
          (Date.now() - new Date(row.next_appointment_date).getTime()) / 86400000,
        );

        await this.alertRepo.save(
          this.alertRepo.create({
            tenantId,
            doctorId: tenantId, // Will be refined when doctor assignment exists
            patientId: row.patient_id,
            alertType: 'missed_followup',
            title: `${row.patient_name} nao retornou`,
            description: `Consulta de ${row.date} com retorno previsto para ${row.next_appointment_date}. Ja se passaram ${daysSince} dias.`,
            suggestedAction: 'Contatar paciente para reagendar',
            severity: daysSince > 14 ? 'action_required' : 'attention',
          }),
        );
      }

      if (missed.length > 0) {
        this.logger.log(`Tenant ${tenantId}: ${missed.length} missed followups detected`);
      }
    } catch (err) {
      this.logger.error(`checkMissedFollowups failed: ${(err as Error).message}`);
    }
  }

  // ── Exames pendentes ha muito tempo ──

  private async checkPendingExams(tenantId: string): Promise<void> {
    try {
      const pending: any[] = await this.consultationRepo.query(
        `SELECT lr.id, lr.exam_name, lr.collection_date, lr.pregnancy_id,
                p.full_name AS patient_name, p.id AS patient_id
         FROM lab_results lr
         JOIN pregnancies preg ON preg.id = lr.pregnancy_id
         JOIN patients p ON p.id = preg.patient_id
         WHERE lr.status = 'pending'
           AND lr.created_at < CURRENT_DATE - INTERVAL '10 days'
           AND p.tenant_id = $1
           AND NOT EXISTS (
             SELECT 1 FROM longitudinal_alerts la
             WHERE la.patient_id = p.id
               AND la.alert_type = 'pending_exam'
               AND la.created_at > CURRENT_DATE - INTERVAL '7 days'
           )
         LIMIT 50`,
        [tenantId],
      );

      for (const row of pending) {
        await this.alertRepo.save(
          this.alertRepo.create({
            tenantId,
            doctorId: tenantId,
            patientId: row.patient_id,
            alertType: 'pending_exam',
            title: `${row.exam_name} pendente — ${row.patient_name}`,
            description: `Exame solicitado e sem resultado ha mais de 10 dias.`,
            suggestedAction: 'Verificar se exame foi realizado. Contatar paciente se necessario.',
            severity: 'attention',
          }),
        );
      }

      if (pending.length > 0) {
        this.logger.log(`Tenant ${tenantId}: ${pending.length} pending exams detected`);
      }
    } catch (err) {
      this.logger.error(`checkPendingExams failed: ${(err as Error).message}`);
    }
  }

  // ── Tendencias no uso do copiloto ──

  private async analyzeCopilotTrends(tenantId: string): Promise<void> {
    try {
      const trends: any[] = await this.checkItemRepo.query(
        `SELECT cc.doctor_id, ci.category, ci.resolution,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE ci.resolution = 'ignored') AS ignored_count
         FROM copilot_check_items ci
         JOIN copilot_checks cc ON cc.id = ci.copilot_check_id
         WHERE cc.tenant_id = $1
           AND cc.created_at > CURRENT_DATE - INTERVAL '30 days'
           AND ci.severity = 'action_required'
           AND ci.resolution IS NOT NULL
         GROUP BY cc.doctor_id, ci.category
         HAVING COUNT(*) >= 5
           AND COUNT(*) FILTER (WHERE ci.resolution = 'ignored') * 100 / COUNT(*) > 50`,
        [tenantId],
      );

      for (const row of trends) {
        const ignoreRate = Math.round((row.ignored_count / row.total) * 100);

        // Evitar duplicatas recentes
        const existing = await this.alertRepo.findOne({
          where: {
            tenantId,
            doctorId: row.doctor_id,
            alertType: 'copilot_trend',
          },
        });
        if (existing && Date.now() - existing.createdAt.getTime() < 7 * 86400000) continue;

        await this.alertRepo.save(
          this.alertRepo.create({
            tenantId,
            doctorId: row.doctor_id,
            alertType: 'copilot_trend',
            title: `Alta taxa de rejeicao em ${row.category}`,
            description: `Nos ultimos 30 dias, ${ignoreRate}% dos alertas de ${row.category} foram ignorados (${row.ignored_count}/${row.total}).`,
            suggestedAction: 'Revisar se os alertas desta categoria sao relevantes para seu contexto clinico.',
            severity: 'attention',
          }),
        );
      }
    } catch (err) {
      this.logger.error(`analyzeCopilotTrends failed: ${(err as Error).message}`);
    }
  }

  // ── Alertas para o dashboard ──

  async getDoctorAlerts(
    doctorId: string,
    tenantId: string | null,
    unreadOnly = false,
    page = 1,
    limit = 20,
  ) {
    const qb = this.alertRepo
      .createQueryBuilder('a')
      .where('a.doctor_id = :doctorId', { doctorId });

    if (tenantId) qb.andWhere('a.tenant_id = :tenantId', { tenantId });
    if (unreadOnly) qb.andWhere('a.read_by_doctor = false');

    const [data, total] = await qb
      .orderBy('a.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    await this.alertRepo.update(alertId, { readByDoctor: true });
  }

  async respondToAlert(alertId: string, response: string): Promise<void> {
    await this.alertRepo.update(alertId, {
      actedUpon: true,
      readByDoctor: true,
      doctorResponse: response,
    });
  }
}
