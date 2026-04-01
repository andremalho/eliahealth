import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { SummaryReportStatus } from '../ultrasound-summary.enums.js';
import { CreateUltrasoundSummaryDto } from './create-ultrasound-summary.dto.js';

export class UpdateUltrasoundSummaryDto extends PartialType(CreateUltrasoundSummaryDto) {
  @IsOptional()
  @IsEnum(SummaryReportStatus)
  reportStatus?: SummaryReportStatus;
}
