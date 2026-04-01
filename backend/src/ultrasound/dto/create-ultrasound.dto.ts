import {
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
} from 'class-validator';
import { UltrasoundExamType, ImageQuality } from '../ultrasound.enums.js';

export class CreateUltrasoundDto {
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsEnum(UltrasoundExamType)
  examType: UltrasoundExamType;

  @IsDateString()
  examDate: string;

  @IsOptional()
  @IsString()
  operatorName?: string;

  @IsOptional()
  @IsString()
  equipmentModel?: string;

  @IsOptional()
  @IsEnum(ImageQuality)
  imageQuality?: ImageQuality;

  @IsOptional()
  @IsString()
  voiceTranscript?: string;

  @IsOptional()
  @IsString()
  finalReport?: string;

  @IsOptional()
  @IsString()
  templateVersion?: string;

  @IsOptional()
  @IsObject()
  extraFields?: Record<string, unknown>;
}
