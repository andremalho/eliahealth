import {
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsString,
  Min,
} from 'class-validator';
import { BpCondition } from '../bp-monitoring.enums.js';

export class CreateBpConfigDto {
  @IsEnum(BpCondition)
  condition: BpCondition;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(80)
  targetSystolicMax?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  targetDiastolicMax?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  criticalSystolic?: number;

  @IsOptional()
  @IsInt()
  @Min(70)
  criticalDiastolic?: number;

  @IsOptional()
  @IsString()
  measurementFrequency?: string;

  @IsOptional()
  @IsString()
  antihypertensiveProtocol?: string;

  @IsOptional()
  @IsString()
  deviceIntegrationId?: string;

  @IsOptional()
  @IsString()
  deviceBrand?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
