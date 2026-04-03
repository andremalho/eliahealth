import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { GaMethod, IvfTransferType } from '../pregnancy.enums.js';

export class QuickCreatePregnancyDto {
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(GaMethod)
  gaMethod: GaMethod;

  @IsOptional()
  @IsDateString()
  lmpDate?: string;

  @IsOptional()
  @IsDateString()
  edd?: string;

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
  ivfTransferDate?: string;

  @IsOptional()
  @IsEnum(IvfTransferType)
  ivfTransferType?: IvfTransferType;

  @IsOptional()
  @IsInt()
  @Min(0)
  gravida?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  para?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  abortus?: number;
}
