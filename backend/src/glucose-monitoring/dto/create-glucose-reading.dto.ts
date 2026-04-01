import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  IsMilitaryTime,
  Min,
  Max,
} from 'class-validator';
import { MeasurementType, ReadingSource } from '../glucose-monitoring.enums.js';

export class CreateGlucoseReadingDto {
  @IsDateString()
  readingDate: string;

  @IsMilitaryTime()
  readingTime: string;

  @IsEnum(MeasurementType)
  measurementType: MeasurementType;

  @IsInt()
  @Min(10)
  @Max(600)
  glucoseValue: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsString()
  symptomsNotes?: string;

  @IsOptional()
  @IsEnum(ReadingSource)
  source?: ReadingSource;

  @IsOptional()
  @IsObject()
  extraFields?: Record<string, unknown>;
}
