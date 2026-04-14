import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../patients/patient.entity.js';
import { Pregnancy } from '../../pregnancies/pregnancy.entity.js';
import { Consultation } from '../../consultations/consultation.entity.js';
import { SessionContext } from '../interfaces/ws-events.interface.js';
import { CopilotInsight } from '../entities/copilot-insight.entity.js';

@Injectable()
export class AnalysisContextService {
  private readonly logger = new Logger(AnalysisContextService.name);
  private sessions: Map<string, SessionContext> = new Map();

  constructor(
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Pregnancy) private readonly pregnancyRepo: Repository<Pregnancy>,
    @InjectRepository(Consultation) private readonly consultationRepo: Repository<Consultation>,
  ) {}

  async initSession(
    socketId: string,
    meta: { consultationId: string; patientId: string; tenantId: string | null; doctorId: string },
  ): Promise<void> {
    this.sessions.set(socketId, {
      ...meta,
      currentFormState: {},
      patientProfile: null,
      recentHistory: [],
      labResults: [],
      currentMedications: [],
      vaccineStatus: [],
      previousInsights: [],
      connectedAt: new Date(),
    });
  }

  async loadPatientContext(socketId: string): Promise<void> {
    const session = this.sessions.get(socketId);
    if (!session) return;

    try {
      const [patient, pregnancy] = await Promise.all([
        this.patientRepo.findOneBy({ id: session.patientId }),
        this.pregnancyRepo.findOne({
          where: { patientId: session.patientId, status: 'active' as any },
          order: { createdAt: 'DESC' },
        }),
      ]);

      if (patient) {
        session.patientProfile = {
          fullName: patient.fullName,
          dateOfBirth: patient.dateOfBirth,
          bloodType: patient.bloodType,
          comorbidities: patient.comorbiditiesSelected ?? [],
          allergies: patient.allergiesSelected ?? [],
          education: patient.education,
        };
      }

      if (pregnancy) {
        const recentConsults = await this.consultationRepo.find({
          where: { pregnancyId: pregnancy.id },
          order: { date: 'DESC' },
          take: 5,
        });

        session.recentHistory = recentConsults.map((c) => ({
          date: c.date,
          gestationalAgeDays: c.gestationalAgeDays,
          assessment: c.assessment,
          plan: c.plan,
          bpSystolic: c.bpSystolic,
          bpDiastolic: c.bpDiastolic,
          alerts: c.alerts,
        }));

        // Enriquecer perfil com dados da gestacao
        if (session.patientProfile) {
          (session.patientProfile as any).gravida = pregnancy.gravida;
          (session.patientProfile as any).para = pregnancy.para;
          (session.patientProfile as any).isHighRisk = pregnancy.isHighRisk;
          (session.patientProfile as any).highRiskFlags = pregnancy.highRiskFlags;
          (session.patientProfile as any).currentMedications = pregnancy.currentMedications;
        }
      }
    } catch (err) {
      this.logger.warn(`Falha ao carregar contexto da paciente: ${(err as Error).message}`);
    }
  }

  updateSessionData(socketId: string, payload: { field: string; value: unknown; currentFormState: Record<string, unknown> }): void {
    const session = this.sessions.get(socketId);
    if (!session) return;
    session.currentFormState = payload.currentFormState;
  }

  addInsightsToSession(socketId: string, insights: CopilotInsight[]): void {
    const session = this.sessions.get(socketId);
    if (!session) return;
    session.previousInsights.push(...insights.map((i) => i.title));
  }

  getSessionContext(socketId: string): SessionContext | undefined {
    return this.sessions.get(socketId);
  }

  destroySession(socketId: string): void {
    this.sessions.delete(socketId);
  }
}
