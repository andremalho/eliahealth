import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CheckResolution } from '../enums/check-resolution.enum.js';

export class ResolveCheckItemDto {
  @IsEnum(CheckResolution)
  resolution: CheckResolution;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;
}
