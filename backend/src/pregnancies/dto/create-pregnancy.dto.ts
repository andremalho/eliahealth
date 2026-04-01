import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsArray,
  IsString,
  Min,
} from 'class-validator';
import { GaMethod, Chorionicity } from '../pregnancy.enums.js';

export class CreatePregnancyDto {
  @IsDateString()
  lmpDate: string;

  @IsOptional()
  @IsDateString()
  usDatingDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  usDatingGaDays?: number;

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
}
