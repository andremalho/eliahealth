import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsInt, IsArray, IsEmail, Min } from 'class-validator';
import { TenantPlan } from '../tenant.entity.js';

export class CreateTenantDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() slug: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() secondaryColor?: string;
  @IsOptional() @IsString() customDomain?: string;
  @IsOptional() @IsBoolean() poweredByVisible?: boolean;
  @IsOptional() @IsString() poweredByText?: string;
  @IsOptional() @IsEnum(TenantPlan) plan?: TenantPlan;
  @IsOptional() @IsInt() @Min(1) maxUsers?: number;
  @IsOptional() @IsInt() @Min(1) maxPatients?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @IsEmail() contactEmail: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() cnpj?: string;
}
