import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';
import { EndDiastolicFlow, DuctusVenosusAwave } from '../ultrasound.enums.js';

export class CreateDopplerDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  fetusNumber?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  umbilicalArteryPI?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  umbilicalArteryRI?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  umbilicalArterySD?: number;

  @IsOptional()
  @IsEnum(EndDiastolicFlow)
  umbilicalArteryEDF?: EndDiastolicFlow;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  mcaPSV?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  mcaPI?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  uterineArteryPI?: number;

  @IsOptional()
  @IsBoolean()
  uterineArteryNotch?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  ductusVenosusPI?: number;

  @IsOptional()
  @IsEnum(DuctusVenosusAwave)
  ductusVenosusAwave?: DuctusVenosusAwave;

  @IsOptional()
  @IsObject()
  extraFields?: Record<string, unknown>;
}
