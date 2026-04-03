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

    for (const step of steps) {
      if (step.isCompleted) continue;

      let done = false;
      switch (step.step) {
        case OnboardingStepName.ADD_PATIENT: {
          const count = await this.patientRepo.count();
          done = count > 0;
          break;
        }
        case OnboardingStepName.ADD_CONSULTATION: {
          const count = await this.consultationRepo.count();
          done = count > 0;
          break;
        }
        case OnboardingStepName.PATIENT_PORTAL_ACCESS: {
          const count = await this.patientRepo
            .createQueryBuilder('p')
            .where('p.email IS NOT NULL')
            .andWhere('p.lgpd_consent_at IS NOT NULL')
            .getCount();
          done = count > 0;
          break;
        }
        case OnboardingStepName.ADD_LAB_EXAM: {
          const exists = await this.checkTableHasRows('lab_results');
          done = exists;
          break;
        }
        case OnboardingStepName.ADD_ULTRASOUND: {
          const exists = await this.checkTableHasRows('ultrasounds');
          done = exists;
          break;
        }
      }

      if (done) {
        step.isCompleted = true;
        step.completedAt = new Date();
        await this.repo.save(step);
      }
    }
  }

  private async checkTableHasRows(table: string): Promise<boolean> {
    const result = await this.repo.query(
      `SELECT EXISTS (SELECT 1 FROM "${table}" LIMIT 1) AS has_rows`,
    );
    return result[0]?.has_rows === true;
  }
}
