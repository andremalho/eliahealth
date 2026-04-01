import {
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { NasalBone, PlacentaGrade } from '../ultrasound.enums.js';

export class CreateBiometryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  fetusNumber?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  bpd?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  hc?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  ac?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  fl?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  efw?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  efwPercentile?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  crownRumpLength?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  nuchalTranslucency?: number;

  @IsOptional()
  @IsEnum(NasalBone)
  nasalBone?: NasalBone;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  amnioticFluidIndex?: number;

  @IsOptional()
  @IsString()
  placentaLocation?: string;

  @IsOptional()
  @IsEnum(PlacentaGrade)
  placentaGrade?: PlacentaGrade;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  cervicalLength?: number;

  @IsOptional()
  @IsObject()
  extraFields?: Record<string, unknown>;
}
