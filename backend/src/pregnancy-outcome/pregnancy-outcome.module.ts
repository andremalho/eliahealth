import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PregnancyOutcome } from './pregnancy-outcome.entity.js';
import { PregnancyOutcomeService } from './pregnancy-outcome.service.js';
import { PregnancyOutcomeController } from './pregnancy-outcome.controller.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([PregnancyOutcome]), PregnanciesModule],
  controllers: [PregnancyOutcomeController],
  providers: [PregnancyOutcomeService],
  exports: [PregnancyOutcomeService],
})
export class PregnancyOutcomeModule {}
