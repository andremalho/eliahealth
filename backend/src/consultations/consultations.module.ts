import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultation.entity.js';
import { ConsultationsService } from './consultations.service.js';
import { ConsultationsController } from './consultations.controller.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';
import { CopilotModule } from '../copilot/copilot.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consultation]),
    PregnanciesModule,
    forwardRef(() => CopilotModule),
  ],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
