import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreventiveExamSchedule } from './preventive-exam-schedule.entity.js';
import { PreventiveExamScheduleService } from './preventive-exam-schedule.service.js';
import { PreventiveExamScheduleController } from './preventive-exam-schedule.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PreventiveExamSchedule])],
  controllers: [PreventiveExamScheduleController],
  providers: [PreventiveExamScheduleService],
  exports: [PreventiveExamScheduleService],
})
export class PreventiveExamScheduleModule {}
