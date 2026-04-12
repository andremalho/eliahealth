import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospitalization } from './hospitalization.entity.js';
import { Evolution } from './evolution.entity.js';
import { HospitalizationController } from './hospitalization.controller.js';
import { HospitalizationService } from './hospitalization.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Hospitalization, Evolution])],
  controllers: [HospitalizationController],
  providers: [HospitalizationService],
  exports: [HospitalizationService],
})
export class HospitalizationModule {}
