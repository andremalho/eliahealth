import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LgpdConsent } from './lgpd-consent.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { LgpdService } from './lgpd.service.js';
import { LgpdController } from './lgpd.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([LgpdConsent, Patient])],
  controllers: [LgpdController],
  providers: [LgpdService],
})
export class LgpdModule {}
