import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
  IsMilitaryTime,
  Min,
} from 'class-validator';
import { AdministrationTimeLabel, AdministeredBy } from '../glucose-monitoring.enums.js';

export class CreateInsulinDoseDto {
  @IsOptional()
  @IsUUID()
  glucoseReadingId?: string;

  @IsDateString()
  administrationDate: string;

  @IsMilitaryTime()
  administrationTime: string;

  @IsEnum(AdministrationTimeLabel)
  administrationTimeLabel: AdministrationTimeLabel;

  @IsString()
  insulinType: string;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  doseUnits: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  prescribedDose?: number;

  @IsEnum(AdministeredBy)
  administeredBy: AdministeredBy;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  extraFields?: Record<string, unknown>;
}
