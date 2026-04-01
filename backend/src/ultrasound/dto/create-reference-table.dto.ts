import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { BiometryParameter } from '../biometry-parameter.enum.js';

export class CreateReferenceTableDto {
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @IsEnum(BiometryParameter)
  parameter: BiometryParameter;

  @IsInt()
  @Min(0)
  gestationalAgeWeeks: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  p5?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  p10?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  p25?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  p50: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  p75?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  p90?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  p95?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  mean?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  sd?: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
