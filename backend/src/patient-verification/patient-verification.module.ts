import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientVerification } from './patient-verification.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { PatientVerificationService } from './patient-verification.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([PatientVerification, Patient])],
  providers: [PatientVerificationService],
  exports: [PatientVerificationService],
})
export class PatientVerificationModule {}
