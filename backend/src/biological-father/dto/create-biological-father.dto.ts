import { IsString, IsEnum, IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { RhFactor } from '../biological-father.entity.js';
import { BloodTypeABO, BloodTypeRH } from '../../patients/patient.enums.js';

export class CreateBiologicalFatherDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(0) age?: number;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() bloodType?: string;
  @IsOptional() @IsEnum(RhFactor) rh?: RhFactor;
  @IsOptional() @IsEnum(BloodTypeABO) bloodTypeABO?: BloodTypeABO;
  @IsOptional() @IsEnum(BloodTypeRH) bloodTypeRH?: BloodTypeRH;
  @IsOptional() @IsString() ethnicity?: string;
  @IsOptional() @IsString() occupation?: string;
  @IsOptional() @IsString() geneticConditions?: string;
  @IsOptional() @IsString() infectiousDiseases?: string;
  @IsOptional() @IsString() familyHistory?: string;
  @IsOptional() @IsString() observations?: string;
}
