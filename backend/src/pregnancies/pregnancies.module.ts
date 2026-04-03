import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pregnancy } from './pregnancy.entity.js';
import { PregnancyShare } from '../teams/pregnancy-share.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { PregnanciesService } from './pregnancies.service.js';
import { PregnanciesController } from './pregnancies.controller.js';
import { PatientVerificationModule } from '../patient-verification/patient-verification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pregnancy, PregnancyShare, Patient]),
    PatientVerificationModule,
  ],
  controllers: [PregnanciesController],
  providers: [PregnanciesService],
  exports: [PregnanciesService],
})
export class PregnanciesModule {}
