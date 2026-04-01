import {
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsString,
  Min,
} from 'class-validator';
import { DiabetesType } from '../glucose-monitoring.enums.js';

export class CreateGlucoseConfigDto {
  @IsEnum(DiabetesType)
  diabetesType: DiabetesType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(50)
  targetFasting?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  target1hPostMeal?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  target2hPostMeal?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  criticalThreshold?: number;

  @IsOptional()
  @IsString()
  insulinProtocol?: string;

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
