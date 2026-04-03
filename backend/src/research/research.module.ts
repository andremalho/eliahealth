import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResearchRecord } from './research-record.entity.js';
import { ResearchDashboard } from './research-dashboard.entity.js';
import { DashboardWidget } from './dashboard-widget.entity.js';
import { ResearchQuery } from './research-query.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { GlucoseMonitoringConfig } from '../glucose-monitoring/glucose-config.entity.js';
import { BpMonitoringConfig } from '../bp-monitoring/bp-config.entity.js';
import { PregnancyOutcome } from '../pregnancy-outcome/pregnancy-outcome.entity.js';
import { ResearchService } from './research.service.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardStatsService } from './dashboard-stats.service.js';
import { ResearchQueryService } from './research-query.service.js';
import { ResearchController } from './research.controller.js';
import { DashboardController } from './dashboard.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResearchRecord, ResearchDashboard, DashboardWidget, ResearchQuery,
      Pregnancy, Patient, GlucoseMonitoringConfig, BpMonitoringConfig, PregnancyOutcome,
    ]),
  ],
  controllers: [ResearchController, DashboardController],
  providers: [ResearchService, DashboardService, DashboardStatsService, ResearchQueryService],
  exports: [ResearchService],
})
export class ResearchModule {}
