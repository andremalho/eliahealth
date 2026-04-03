import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { RhFactor } from '../biological-father.entity.js';

export class CreateBiologicalFatherDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(0) age?: number;
  @IsOptional() @IsString() bloodType?: string;
  @IsOptional() @IsEnum(RhFactor) rh?: RhFactor;
  @IsOptional() @IsString() geneticConditions?: string;
  @IsOptional() @IsString() infectiousDiseases?: string;
  @IsOptional() @IsString() familyHistory?: string;
  @IsOptional() @IsString() observations?: string;
}
