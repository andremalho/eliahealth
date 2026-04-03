import {
  IsDateString, IsEnum, IsOptional, IsString, IsInt, IsArray, IsObject, Min,
} from 'class-validator';
import { DeliveryType } from '../pregnancy-outcome.entity.js';

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
  gestationalAgeAtDelivery: number;

  @IsOptional()
  @IsString()
  hospitalName?: string;

  @IsOptional()
  @IsArray()
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
  bloodLossEstimated?: number;

  @IsOptional()
  @IsInt()
  placentaWeight?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
