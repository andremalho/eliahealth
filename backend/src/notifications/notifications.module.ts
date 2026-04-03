import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { PatientVerificationModule } from '../patient-verification/patient-verification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Patient, Pregnancy]),
    PatientVerificationModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
