import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationSummary } from './consultation-summary.entity.js';
import { ConsultationSummaryService } from './consultation-summary.service.js';
import { ConsultationSummaryController } from './consultation-summary.controller.js';
import { Consultation } from '../consultations/consultation.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { User } from '../auth/user.entity.js';
import { WhatsAppModule } from '../shared/whatsapp/whatsapp.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsultationSummary,
      Consultation,
      Patient,
      Pregnancy,
      User,
    ]),
    WhatsAppModule,
  ],
  controllers: [ConsultationSummaryController],
  providers: [ConsultationSummaryService],
  exports: [ConsultationSummaryService],
})
export class ConsultationSummaryModule {}
