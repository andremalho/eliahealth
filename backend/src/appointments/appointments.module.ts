import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Appointment } from './appointment.entity.js';
import { SecretaryAssignment } from './secretary-assignment.entity.js';
import { DoctorSchedule, DoctorBlockedDate } from './doctor-schedule.entity.js';
import { AppointmentAlert } from './appointment-alert.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { SlotGenerationService } from './slot-generation.service.js';
import { AutoScheduleService } from './auto-schedule.service.js';
import { AppointmentReminderService } from './appointment-reminder.service.js';
import { AppointmentAlertService } from './appointment-alert.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, SecretaryAssignment, DoctorSchedule, DoctorBlockedDate, AppointmentAlert, Pregnancy]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, SlotGenerationService, AutoScheduleService, AppointmentReminderService, AppointmentAlertService],
  exports: [AppointmentsService, SlotGenerationService, AutoScheduleService, AppointmentAlertService],
})
export class AppointmentsModule {}
