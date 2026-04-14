import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CopilotCheck } from './entities/copilot-check.entity.js';
import { CopilotCheckItem } from './entities/copilot-check-item.entity.js';
import { ClinicalCopilotService } from './clinical-copilot.service.js';
import { ClinicalCopilotController } from './clinical-copilot.controller.js';
import { Consultation } from '../consultations/consultation.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';
import { ConsultationsModule } from '../consultations/consultations.module.js';
import { LabResultsModule } from '../lab-results/lab-results.module.js';
import { VaccinesModule } from '../vaccines/vaccines.module.js';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module.js';
import { GlucoseMonitoringModule } from '../glucose-monitoring/glucose-monitoring.module.js';
import { BpMonitoringModule } from '../bp-monitoring/bp-monitoring.module.js';
import { ClinicalProtocolsModule } from '../clinical-protocols/clinical-protocols.module.js';
import { ConsultationSummaryModule } from '../consultation-summary/consultation-summary.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CopilotCheck,
      CopilotCheckItem,
      Consultation,
      Patient,
      Pregnancy,
    ]),
    PregnanciesModule,
    forwardRef(() => ConsultationsModule),
    LabResultsModule,
    VaccinesModule,
    PrescriptionsModule,
    GlucoseMonitoringModule,
    BpMonitoringModule,
    ClinicalProtocolsModule,
    ConsultationSummaryModule,
  ],
  controllers: [ClinicalCopilotController],
  providers: [ClinicalCopilotService],
  exports: [ClinicalCopilotService],
})
export class ClinicalCopilotModule {}
