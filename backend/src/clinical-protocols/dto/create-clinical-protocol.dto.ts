import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { ProtocolCategory, ProtocolPriority } from '../clinical-protocol.enums.js';

export class CreateClinicalProtocolDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(ProtocolCategory)
  category: ProtocolCategory;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  gaWeeksMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  gaWeeksMax?: number;

  @IsOptional()
  @IsString()
  triggerCondition?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actionItems?: string[];

  @IsEnum(ProtocolPriority)
  priority: ProtocolPriority;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
