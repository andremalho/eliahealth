import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Relationship } from '../emergency-contact.entity.js';

export class CreateEmergencyContactDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEnum(Relationship) relationship: Relationship;
  @IsString() @IsNotEmpty() phone: string;
  @IsOptional() @IsString() phone2?: string;
  @IsOptional() @IsBoolean() isMainContact?: boolean;
  @IsOptional() @IsString() notes?: string;
}
