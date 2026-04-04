import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingStep } from './onboarding-step.entity.js';
import { OnboardingStepName } from './onboarding.enums.js';
import { Patient } from '../patients/patient.entity.js';
import { Consultation } from '../consultations/consultation.entity.js';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingStep)
    private readonly repo: Repository<OnboardingStep>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
  ) {}

  async seedForUser(userId: string): Promise<OnboardingStep[]> {
    const existing = await this.repo.findBy({ userId });
    if (existing.length > 0) return existing;

    const steps = Object.values(OnboardingStepName).map((step) =>
      this.repo.create({ userId, step }),
    );
    return this.repo.save(steps);
  }

  async findAll(userId: string): Promise<OnboardingStep[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async completeStep(
    userId: string,
    step: OnboardingStepName,
  ): Promise<OnboardingStep> {
    const record = await this.repo.findOneBy({ userId, step });
    if (!record) {
      throw new NotFoundException(`Step ${step} nao encontrado`);
    }
    if (!record.isCompleted) {
      record.isCompleted = true;
      record.completedAt = new Date();
      await this.repo.save(record);
    }
    return record;
  }

  async getProgress(userId: string) {
    const steps = await this.repo.findBy({ userId });
    const total = steps.length;
    const completed = steps.filter((s) => s.isCompleted).length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  async checkAndUpdateSteps(userId: string): Promise<void> {
    const steps = await this.repo.findBy({ userId });
    if (steps.length === 0) return;

    const pendingSteps = steps.filter((s) => !s.isCompleted);
    if (pendingSteps.length === 0) return;

    // Single query to check all conditions at once
    const [checks] = await this.repo.query(`
      SELECT
        (SELECT COUNT(*)::int > 0 FROM patients) AS has_patient,
        (SELECT COUNT(*)::int > 0 FROM consultations) AS has_consultation,
        (SELECT COUNT(*)::int > 0 FROM patients WHERE email IS NOT NULL AND lgpd_consent_at IS NOT NULL) AS has_portal_access,
        (SELECT COUNT(*)::int > 0 FROM lab_results) AS has_lab_exam,
        (SELECT COUNT(*)::int > 0 FROM ultrasounds) AS has_ultrasound
    `);

    const completionMap: Record<string, boolean> = {
      [OnboardingStepName.ADD_PATIENT]: checks.has_patient,
      [OnboardingStepName.ADD_CONSULTATION]: checks.has_consultation,
      [OnboardingStepName.PATIENT_PORTAL_ACCESS]: checks.has_portal_access,
      [OnboardingStepName.ADD_LAB_EXAM]: checks.has_lab_exam,
      [OnboardingStepName.ADD_ULTRASOUND]: checks.has_ultrasound,
    };

    const toUpdate: OnboardingStep[] = [];
    const now = new Date();
    for (const step of pendingSteps) {
      if (completionMap[step.step]) {
        step.isCompleted = true;
        step.completedAt = now;
        toUpdate.push(step);
      }
    }

    if (toUpdate.length > 0) {
      await this.repo.save(toUpdate);
    }
  }
}
