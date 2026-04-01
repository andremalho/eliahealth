import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ultrasound } from './ultrasound.entity.js';
import { FetalBiometry } from './fetal-biometry.entity.js';
import { DopplerData } from './doppler-data.entity.js';
import { BiophysicalProfile } from './biophysical-profile.entity.js';
import { BiometryReferenceTable } from './biometry-reference-table.entity.js';
import { UltrasoundSummary } from './ultrasound-summary.entity.js';
import { UltrasoundService } from './ultrasound.service.js';
import { ReferenceTableService } from './reference-table.service.js';
import { UltrasoundSummaryService } from './ultrasound-summary.service.js';
import { UltrasoundController } from './ultrasound.controller.js';
import { ReferenceTableController } from './reference-table.controller.js';
import { UltrasoundSummaryController } from './ultrasound-summary.controller.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ultrasound,
      FetalBiometry,
      DopplerData,
      BiophysicalProfile,
      BiometryReferenceTable,
      UltrasoundSummary,
    ]),
    PregnanciesModule,
  ],
  controllers: [UltrasoundController, ReferenceTableController, UltrasoundSummaryController],
  providers: [UltrasoundService, ReferenceTableService, UltrasoundSummaryService],
  exports: [UltrasoundService, ReferenceTableService, UltrasoundSummaryService],
})
export class UltrasoundModule {}
