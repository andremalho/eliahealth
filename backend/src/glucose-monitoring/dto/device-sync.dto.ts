import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MeasurementType } from '../glucose-monitoring.enums.js';

export class DeviceSyncReadingDto {
  @IsString()
  deviceReadingId: string;

  @IsDateString()
  readingDateTime: string;

  @IsInt()
  @Min(10)
  @Max(600)
  glucoseValue: number;

  @IsOptional()
  @IsEnum(MeasurementType)
  measurementType?: MeasurementType;

  @IsOptional()
  @IsObject()
  rawDeviceData?: Record<string, unknown>;
}

export class DeviceSyncDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceSyncReadingDto)
  readings: DeviceSyncReadingDto[];
}
