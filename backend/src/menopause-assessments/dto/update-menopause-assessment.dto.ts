import { PartialType } from '@nestjs/mapped-types';
import { CreateMenopauseAssessmentDto } from './create-menopause-assessment.dto.js';

export class UpdateMenopauseAssessmentDto extends PartialType(
  CreateMenopauseAssessmentDto,
) {}
