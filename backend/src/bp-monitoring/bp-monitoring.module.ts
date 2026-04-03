import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BpMonitoringConfig } from './bp-config.entity.js';
import { BpReading } from './bp-reading.entity.js';
import { BpMonitoringService } from './bp-monitoring.service.js';
import { BpMonitoringController } from './bp-monitoring.controller.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BpMonitoringConfig, BpReading]),
    PregnanciesModule,
  ],
  controllers: [BpMonitoringController],
  providers: [BpMonitoringService],
  exports: [BpMonitoringService],
})
export class BpMonitoringModule {}
