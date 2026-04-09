import { PartialType } from '@nestjs/mapped-types';
import { CreatePostpartumConsultationDto } from './create-postpartum-consultation.dto.js';

export class UpdatePostpartumConsultationDto extends PartialType(CreatePostpartumConsultationDto) {}
