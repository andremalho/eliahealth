import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, IsArray } from 'class-validator';
import { PrescriptionStatus } from '../prescription.entity.js';

export class CreatePrescriptionDto {
  @IsOptional() @IsUUID() consultationId?: string;
  @IsDateString() prescriptionDate: string;
  @IsArray() medications: Record<string, unknown>[];
  @IsOptional() @IsEnum(PrescriptionStatus) status?: PrescriptionStatus;
  @IsOptional() @IsString() notes?: string;
}
