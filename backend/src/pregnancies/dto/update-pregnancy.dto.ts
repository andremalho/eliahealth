import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { PregnancyStatus } from '../pregnancy.enums.js';
import { CreatePregnancyDto } from './create-pregnancy.dto.js';

export class UpdatePregnancyDto extends PartialType(CreatePregnancyDto) {
  @IsOptional()
  @IsEnum(PregnancyStatus)
  status?: PregnancyStatus;
}
