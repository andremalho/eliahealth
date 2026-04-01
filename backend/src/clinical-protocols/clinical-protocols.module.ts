import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalProtocol } from './clinical-protocol.entity.js';
import { ExamSchedule } from './exam-schedule.entity.js';
import { ClinicalProtocolsService } from './clinical-protocols.service.js';
import { ClinicalProtocolsController } from './clinical-protocols.controller.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';
import { LabResultsModule } from '../lab-results/lab-results.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClinicalProtocol, ExamSchedule]),
    PregnanciesModule,
    LabResultsModule,
  ],
  controllers: [ClinicalProtocolsController],
  providers: [ClinicalProtocolsService],
  exports: [ClinicalProtocolsService],
})
export class ClinicalProtocolsModule {}
