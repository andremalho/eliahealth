import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingProgress } from './entities/onboarding-progress.entity.js';

@Injectable()
export class DoctorOnboardingService {
  constructor(
    @InjectRepository(OnboardingProgress)
    private readonly repo: Repository<OnboardingProgress>,
  ) {}

  async getProgress(userId: string, flowName: string): Promise<OnboardingProgress | null> {
    return this.repo.findOneBy({ userId, flowName });
  }

  async updateProgress(
    userId: string,
    tenantId: string | null,
    flowName: string,
    update: { currentStep?: number; completed?: boolean; skipped?: boolean },
  ): Promise<OnboardingProgress> {
    let progress = await this.repo.findOneBy({ userId, flowName });

    if (!progress) {
      progress = this.repo.create({ userId, tenantId, flowName });
    }

    if (update.currentStep != null) progress.currentStep = update.currentStep;
    if (update.completed) {
      progress.completed = true;
      progress.completedAt = new Date();
    }
    if (update.skipped) progress.skipped = true;

    return this.repo.save(progress);
  }

  async restart(userId: string, tenantId: string | null, flowName: string): Promise<OnboardingProgress> {
    let progress = await this.repo.findOneBy({ userId, flowName });

    if (!progress) {
      progress = this.repo.create({ userId, tenantId, flowName });
    }

    progress.currentStep = 0;
    progress.completed = false;
    progress.skipped = false;
    progress.completedAt = null;
    return this.repo.save(progress);
  }
}
