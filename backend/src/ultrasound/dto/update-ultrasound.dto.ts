import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ReportStatus } from '../ultrasound.enums.js';
import { CreateUltrasoundDto } from './create-ultrasound.dto.js';

export class UpdateUltrasoundDto extends PartialType(CreateUltrasoundDto) {
  @IsOptional()
  @IsEnum(ReportStatus)
  reportStatus?: ReportStatus;
}
