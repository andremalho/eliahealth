import { PartialType } from '@nestjs/mapped-types';
import { CreateMenstrualCycleAssessmentDto } from './create-menstrual-cycle-assessment.dto.js';

export class UpdateMenstrualCycleAssessmentDto extends PartialType(
  CreateMenstrualCycleAssessmentDto,
) {}
