import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ExamCategory, AttachmentType } from '../lab-result.enums.js';

export class CreateLabResultDto {
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsString()
  @IsNotEmpty()
  examName: string;

  @IsEnum(ExamCategory)
  examCategory: ExamCategory;

  @IsOptional()
  @IsString()
  examSubcategory?: string;

  @IsDateString()
  requestedAt: string;

  @IsOptional()
  @IsDateString()
  resultDate?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  referenceMin?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  referenceMax?: number;

  @IsOptional()
  @IsString()
  referenceText?: string;

  @IsOptional()
  @IsString()
  resultText?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  aiInterpretation?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsEnum(AttachmentType)
  attachmentType?: AttachmentType;

  @IsOptional()
  @IsString()
  labIntegrationId?: string;

  @IsOptional()
  @IsString()
  labName?: string;
}
