import {
  IsDateString,
  IsEnum,
  IsInt,
  IsBoolean,
  IsOptional,
  IsArray,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { GaMethod, Chorionicity, IvfTransferType, DiabetesSubtype } from '../pregnancy.enums.js';

export class CreatePregnancyDto {
  @IsOptional()
  @IsDateString()
  lmpDate?: string;

  @IsOptional()
  @IsDateString()
  usDatingDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  usDatingGaDays?: number;

  @IsOptional()
  @IsEnum(IvfTransferType)
  ivfTransferType?: IvfTransferType;

  @IsOptional()
  @IsDateString()
  ivfTransferDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(45)
  gaWeeks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  gaDays?: number;

  @IsOptional()
  @IsDateString()
  edd?: string;

  @IsEnum(GaMethod)
  gaMethod: GaMethod;

  @IsInt()
  @Min(0)
  gravida: number;

  @IsInt()
  @Min(0)
  para: number;

  @IsInt()
  @Min(0)
  abortus: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  plurality?: number;

  @IsOptional()
  @IsEnum(Chorionicity)
  chorionicity?: Chorionicity;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highRiskFlags?: string[];

  @IsOptional()
  @IsBoolean()
  isHighRisk?: boolean;

  @IsOptional()
  @IsString()
  currentPathologies?: string;

  @IsOptional()
  @IsString()
  currentMedications?: string;

  @IsOptional()
  @IsString()
  habits?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  cesareans?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  vaginalDeliveries?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  forcepsDeliveries?: number;

  @IsOptional()
  @IsString()
  previousPregnanciesNotes?: string;

  @IsOptional()
  @IsEnum(DiabetesSubtype)
  diabetesSubtype?: DiabetesSubtype;

  @IsOptional()
  @IsString()
  personalHistory?: string;

  @IsOptional()
  @IsString()
  gynecologicalHistory?: string;
}
