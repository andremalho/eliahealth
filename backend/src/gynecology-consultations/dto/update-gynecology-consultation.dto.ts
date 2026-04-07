import { PartialType } from '@nestjs/mapped-types';
import { CreateGynecologyConsultationDto } from './create-gynecology-consultation.dto.js';

export class UpdateGynecologyConsultationDto extends PartialType(
  CreateGynecologyConsultationDto,
) {}
