import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultation.entity.js';
import { ConsultationsService } from './consultations.service.js';
import { ConsultationsController } from './consultations.controller.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Consultation]), PregnanciesModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
