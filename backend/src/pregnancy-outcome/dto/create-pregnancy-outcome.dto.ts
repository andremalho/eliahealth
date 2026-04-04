import {
  IsDateString, IsEnum, IsOptional, IsString, IsInt, IsArray, IsObject, Min, Max,
} from 'class-validator';
import { DeliveryType } from '../pregnancy-outcome.entity.js';

// Neonatal data structure (validated at runtime via pipe):
// { birthWeight: 200-7000g, apgar1min: 0-10, apgar5min: 0-10, sex: string, notes: string }

export class CreatePregnancyOutcomeDto {
  @IsDateString()
  deliveryDate: string;

  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @IsOptional()
  @IsString()
  deliveryIndication?: string;

  @IsInt()
  @Min(0)
  @Max(300)
  gestationalAgeAtDelivery: number;

  @IsOptional()
  @IsString()
  hospitalName?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  neonatalData?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  maternalComplications?: string[];

  @IsOptional()
  @IsString()
  maternalComplicationsNotes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  bloodLossEstimated?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(2000)
  placentaWeight?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
