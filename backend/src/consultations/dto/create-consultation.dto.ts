import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { EdemaGrade } from '../consultation.enums.js';

export class CreateConsultationDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  bpSystolic?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  bpDiastolic?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  fundalHeightCm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  fetalHeartRate?: number;

  @IsOptional()
  @IsEnum(EdemaGrade)
  edemaGrade?: EdemaGrade;

  @IsOptional()
  @IsString()
  subjective?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsObject()
  aiSuggestions?: Record<string, unknown>;
}
