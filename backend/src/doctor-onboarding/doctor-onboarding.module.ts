import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingProgress } from './entities/onboarding-progress.entity.js';
import { DoctorOnboardingService } from './doctor-onboarding.service.js';
import { DoctorOnboardingController } from './doctor-onboarding.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([OnboardingProgress])],
  controllers: [DoctorOnboardingController],
  providers: [DoctorOnboardingService],
})
export class DoctorOnboardingModule {}
