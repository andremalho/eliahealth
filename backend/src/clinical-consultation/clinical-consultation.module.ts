import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalConsultation } from './clinical-consultation.entity.js';
import { ClinicalConsultationController } from './clinical-consultation.controller.js';
import { ClinicalConsultationService } from './clinical-consultation.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalConsultation])],
  controllers: [ClinicalConsultationController],
  providers: [ClinicalConsultationService],
  exports: [ClinicalConsultationService],
})
export class ClinicalConsultationModule {}
