import { PartialType } from '@nestjs/mapped-types';
import { CreateConsultationDto } from './create-consultation.dto.js';

export class UpdateConsultationDto extends PartialType(CreateConsultationDto) {}
