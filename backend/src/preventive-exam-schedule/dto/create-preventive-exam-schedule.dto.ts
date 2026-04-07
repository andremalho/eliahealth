import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import {
  WomensLifePhase,
  PreventiveExamItem,
  VaccinationItem,
  PreventiveAlert,
} from '../preventive-exam-schedule.enums.js';

export class CreatePreventiveExamScheduleDto {
  @IsDateString()
  generatedDate: string;

  @IsInt()
  @Min(0)
  @Max(120)
  patientAgeAtGeneration: number;

  @IsEnum(WomensLifePhase)
  lifePhase: WomensLifePhase;

  @IsArray()
  examSchedule: PreventiveExamItem[];

  @IsOptional()
  @IsArray()
  vaccinationSchedule?: VaccinationItem[];

  @IsOptional()
  @IsArray()
  clinicalAlerts?: PreventiveAlert[];

  @IsDateString()
  nextReviewDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
