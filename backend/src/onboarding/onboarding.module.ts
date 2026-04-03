import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingStep } from './onboarding-step.entity.js';
import { OnboardingService } from './onboarding.service.js';
import { OnboardingController } from './onboarding.controller.js';
import { Patient } from '../patients/patient.entity.js';
import { Consultation } from '../consultations/consultation.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([OnboardingStep, Patient, Consultation])],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
