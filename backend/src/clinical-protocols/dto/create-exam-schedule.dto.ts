import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { Trimester } from '../clinical-protocol.enums.js';

export class CreateExamScheduleDto {
  @IsString()
  @IsNotEmpty()
  examName: string;

  @IsString()
  @IsNotEmpty()
  examCategory: string;

  @IsInt()
  @Min(0)
  gaWeeksIdeal: number;

  @IsInt()
  @Min(0)
  gaWeeksMin: number;

  @IsInt()
  @Min(0)
  gaWeeksMax: number;

  @IsEnum(Trimester)
  trimester: Trimester;

  @IsBoolean()
  isRoutine: boolean;

  @IsOptional()
  @IsString()
  indication?: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
