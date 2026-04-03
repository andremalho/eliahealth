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
import {
  BpArm, BpPosition, BpReadingSource,
  BpMeasurementLocation, BpMeasurementMethod,
} from '../bp-monitoring.enums.js';

export class CreateBpReadingDto {
  @IsDateString()
  readingDate: string;

  @IsMilitaryTime()
  readingTime: string;

  @IsInt()
  @Min(40)
  @Max(300)
  systolic: number;

  @IsInt()
  @Min(20)
  @Max(200)
  diastolic: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(250)
  heartRate?: number;

  @IsOptional()
  @IsEnum(BpArm)
  arm?: BpArm;

  @IsOptional()
  @IsEnum(BpPosition)
  position?: BpPosition;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsString()
  symptomsNotes?: string;

  @IsOptional()
  @IsEnum(BpReadingSource)
  source?: BpReadingSource;

  @IsOptional()
  @IsEnum(BpMeasurementLocation)
  measurementLocation?: BpMeasurementLocation;

  @IsOptional()
  @IsEnum(BpMeasurementMethod)
  measurementMethod?: BpMeasurementMethod;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsObject()
  extraFields?: Record<string, unknown>;
}
