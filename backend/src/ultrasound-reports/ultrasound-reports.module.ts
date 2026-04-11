import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UltrasoundReport } from './ultrasound-report.entity.js';
import { UltrasoundReportsController } from './ultrasound-reports.controller.js';
import { UltrasoundReportsService } from './ultrasound-reports.service.js';
import { ScreeningRiskService } from './screening-risk.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UltrasoundReport])],
  controllers: [UltrasoundReportsController],
  providers: [UltrasoundReportsService, ScreeningRiskService],
  exports: [UltrasoundReportsService, ScreeningRiskService],
})
export class UltrasoundReportsModule {}
