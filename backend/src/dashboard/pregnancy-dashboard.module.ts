import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { PregnancyDashboardService } from './pregnancy-dashboard.service.js';
import { PregnancyDashboardController } from './pregnancy-dashboard.controller.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pregnancy, Patient]),
    PregnanciesModule,
  ],
  controllers: [PregnancyDashboardController],
  providers: [PregnancyDashboardService],
})
export class PregnancyDashboardModule {}
