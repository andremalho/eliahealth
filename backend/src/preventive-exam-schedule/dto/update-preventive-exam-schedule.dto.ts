import { PartialType } from '@nestjs/mapped-types';
import { CreatePreventiveExamScheduleDto } from './create-preventive-exam-schedule.dto.js';

export class UpdatePreventiveExamScheduleDto extends PartialType(
  CreatePreventiveExamScheduleDto,
) {}
