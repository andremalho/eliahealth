import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { PresentAbsent, AmnioticFluidStatus, NstResult } from '../ultrasound.enums.js';

export class CreateBiophysicalDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  fetusNumber?: number;

  @IsEnum(PresentAbsent)
  fetalBreathing: PresentAbsent;

  @IsEnum(PresentAbsent)
  fetalMovement: PresentAbsent;

  @IsEnum(PresentAbsent)
  fetalTone: PresentAbsent;

  @IsEnum(AmnioticFluidStatus)
  amnioticFluid: AmnioticFluidStatus;

  @IsOptional()
  @IsEnum(NstResult)
  nstResult?: NstResult;

  @IsInt()
  @Min(0)
  @Max(10)
  totalScore: number;

  @IsOptional()
  @IsString()
  interpretation?: string;

  @IsOptional()
  @IsObject()
  extraFields?: Record<string, unknown>;
}
