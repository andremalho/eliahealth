import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CopilotAlert } from './copilot-alert.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { CopilotService } from './copilot.service.js';
import { CopilotController } from './copilot.controller.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';
import { ConsultationsModule } from '../consultations/consultations.module.js';
import { LabResultsModule } from '../lab-results/lab-results.module.js';
import { ClinicalProtocolsModule } from '../clinical-protocols/clinical-protocols.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CopilotAlert, Patient]),
    PregnanciesModule,
    forwardRef(() => ConsultationsModule),
    LabResultsModule,
    ClinicalProtocolsModule,
  ],
  controllers: [CopilotController],
  providers: [CopilotService],
  exports: [CopilotService],
})
export class CopilotModule {}
