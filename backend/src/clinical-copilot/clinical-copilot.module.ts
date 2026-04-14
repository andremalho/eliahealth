import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CopilotCheck } from './entities/copilot-check.entity.js';
import { CopilotCheckItem } from './entities/copilot-check-item.entity.js';
import { CopilotInsight } from './entities/copilot-insight.entity.js';
import { LongitudinalAlert } from './entities/longitudinal-alert.entity.js';
import { ClinicalCopilotService } from './clinical-copilot.service.js';
import { ClinicalCopilotController } from './clinical-copilot.controller.js';
import { CopilotGateway } from './gateway/copilot.gateway.js';
import { WsJwtGuard } from './gateway/ws-jwt.guard.js';
import { RealtimeAnalysisService } from './services/realtime-analysis.service.js';
import { AnalysisContextService } from './services/analysis-context.service.js';
import { LongitudinalIntelligenceService } from './services/longitudinal-intelligence.service.js';
import { LongitudinalCron } from './cron/longitudinal.cron.js';
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
      CopilotInsight,
      LongitudinalAlert,
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
  providers: [
    ClinicalCopilotService,
    CopilotGateway,
    WsJwtGuard,
    RealtimeAnalysisService,
    AnalysisContextService,
    LongitudinalIntelligenceService,
    LongitudinalCron,
  ],
  exports: [ClinicalCopilotService, RealtimeAnalysisService],
})
export class ClinicalCopilotModule {}
