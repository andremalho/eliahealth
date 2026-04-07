import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  IUIIndication,
  SpermPrep,
  SpermSource,
  TechnicalDifficulty,
} from '../assisted-reproduction.enums.js';

export class CreateIuiCycleDto {
  @IsOptional() @IsUUID() partnerId?: string;
  @IsOptional() @IsUUID() doctorId?: string;
  @IsInt() @Min(1) cycleNumber: number;
  @IsDateString() iuiDate: string;
  @IsEnum(IUIIndication) indication: IUIIndication;
  @IsEnum(SpermPrep) spermPreparationMethod: SpermPrep;
  @IsEnum(SpermSource) spermSource: SpermSource;

  @IsOptional() @IsString() donorId?: string;
  @IsOptional() @IsNumber() postWashConcentration?: number;
  @IsOptional() @IsNumber() postWashTotalMotile?: number;
  @IsOptional() @IsNumber() postWashProgressiveMotility?: number;
  @IsOptional() @IsString() catheterType?: string;
  @IsOptional() @IsEnum(TechnicalDifficulty) technicalDifficulty?: TechnicalDifficulty;
  @IsOptional() @IsUUID() oiCycleId?: string;
  @IsOptional() @IsBoolean() luteralSupport?: boolean;
  @IsOptional() @IsString() luteralSupportProtocol?: string;
  @IsOptional() @IsDateString() pregnancyTestDate?: string;
  @IsOptional() @IsNumber() betaHcgValue?: number;
  @IsOptional() @IsBoolean() clinicalPregnancy?: boolean;
  @IsOptional() @IsString() notes?: string;

  @IsOptional() @IsArray() alerts?: Record<string, unknown>[];
}
