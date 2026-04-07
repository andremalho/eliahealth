import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GynecologyConsultation } from './gynecology-consultation.entity.js';
import { GynecologyConsultationsService } from './gynecology-consultations.service.js';
import { GynecologyConsultationsController } from './gynecology-consultations.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([GynecologyConsultation])],
  controllers: [GynecologyConsultationsController],
  providers: [GynecologyConsultationsService],
  exports: [GynecologyConsultationsService],
})
export class GynecologyConsultationsModule {}
