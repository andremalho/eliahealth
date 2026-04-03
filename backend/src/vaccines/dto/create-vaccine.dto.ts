import {
  IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, IsDateString, IsArray, Min,
} from 'class-validator';
import { VaccineType, VaccineStatus, DoseStatus } from '../vaccine.entity.js';

export class CreateVaccineDto {
  @IsString() @IsNotEmpty() vaccineName: string;
  @IsEnum(VaccineType) vaccineType: VaccineType;
  @IsOptional() @IsInt() @Min(1) doseNumber?: number;
  @IsOptional() @IsDateString() scheduledDate?: string;
  @IsOptional() @IsDateString() administeredDate?: string;
  @IsOptional() @IsEnum(VaccineStatus) status?: VaccineStatus;
  @IsOptional() @IsString() batchNumber?: string;
  @IsOptional() @IsString() administeredBy?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsDateString() nextDoseDate?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsInt() @Min(1) totalDosesRequired?: number;
  @IsOptional() @IsArray() doseSequence?: DoseStatus[];
  @IsOptional() @IsDateString() lastDoseDate?: string;
}
