import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlucoseMonitoringConfig } from './glucose-config.entity.js';
import { GlucoseReading } from './glucose-reading.entity.js';
import { InsulinDose } from './insulin-dose.entity.js';
import { GlucoseMonitoringService } from './glucose-monitoring.service.js';
import { GlucoseMonitoringController } from './glucose-monitoring.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([GlucoseMonitoringConfig, GlucoseReading, InsulinDose])],
  controllers: [GlucoseMonitoringController],
  providers: [GlucoseMonitoringService],
  exports: [GlucoseMonitoringService],
})
export class GlucoseMonitoringModule {}
