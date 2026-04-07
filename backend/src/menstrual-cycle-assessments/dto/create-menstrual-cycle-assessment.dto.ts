import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  MenstrualComplaint,
  LeiomyomaFIGO,
} from '../menstrual-cycle-assessment.enums.js';
import { EndometriosisStage } from '../../gynecology-consultations/gynecology-consultation.enums.js';

export class CreateMenstrualCycleAssessmentDto {
  @IsOptional() @IsUUID() doctorId?: string;

  @IsDateString()
  assessmentDate: string;

  @IsEnum(MenstrualComplaint)
  chiefComplaint: MenstrualComplaint;

  @IsOptional() @IsInt() @Min(0) cycleIntervalDays?: number;
  @IsOptional() @IsInt() @Min(0) cycleDurationDays?: number;
  @IsOptional() @IsDateString() lastMenstrualPeriod?: string;
  @IsOptional() @IsInt() @Min(0) estimatedBloodVolumeMl?: number;
  @IsOptional() @IsInt() @Min(0) pictorialBloodChart?: number;
  @IsOptional() @IsInt() @Min(0) numberOfPadsPerDay?: number;

  // PALM
  @IsOptional() @IsBoolean() palmPolyp?: boolean;
  @IsOptional() @IsBoolean() palmAdenomyosis?: boolean;
  @IsOptional() @IsBoolean() palmLeiomyoma?: boolean;
  @IsOptional() @IsEnum(LeiomyomaFIGO) palmLeiomyomaLocation?: LeiomyomaFIGO;
  @IsOptional() @IsBoolean() palmMalignancyOrHyperplasia?: boolean;
  @IsOptional() @IsString() palmMalignancyDetails?: string;

  // COEIN
  @IsOptional() @IsBoolean() coeinCoagulopathy?: boolean;
  @IsOptional() @IsString() coeinCoagulopathyType?: string;
  @IsOptional() @IsBoolean() coeinOvulatoryDysfunction?: boolean;
  @IsOptional() @IsString() coeinOvulatoryType?: string;
  @IsOptional() @IsBoolean() coeinEndometrial?: boolean;
  @IsOptional() @IsBoolean() coeinIatrogenic?: boolean;
  @IsOptional() @IsString() coeinIatrogenicDetails?: string;
  @IsOptional() @IsBoolean() coeinNotYetClassified?: boolean;

  // Diagnósticos específicos
  @IsOptional() @IsBoolean() pcosDiagnosis?: boolean;
  @IsOptional() @IsObject() pcosRotterdamCriteria?: Record<string, unknown>;
  @IsOptional() @IsNumber() pcosHomaIr?: number;
  @IsOptional() @IsString() pcosMetabolicRisk?: string;
  @IsOptional() @IsBoolean() endometriosisDiagnosis?: boolean;
  @IsOptional() @IsEnum(EndometriosisStage) endometriosisStage?: EndometriosisStage;
  @IsOptional() @IsArray() @IsString({ each: true }) endometriosisLocation?: string[];

  // Labs / imagem
  @IsOptional() @IsObject() labs?: Record<string, unknown>;
  @IsOptional() @IsObject() transvaginalUltrasound?: Record<string, unknown>;
  @IsOptional() @IsObject() pelvicMRI?: Record<string, unknown>;

  // Conduta
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) icd10Codes?: string[];
  @IsOptional() @IsString() treatmentPlan?: string;
  @IsOptional() @IsObject() medicationPrescribed?: Record<string, unknown>;
  @IsOptional() @IsBoolean() surgicalReferral?: boolean;
  @IsOptional() @IsString() surgicalDetails?: string;
  @IsOptional() @IsBoolean() hysteroscopyPerformed?: boolean;
  @IsOptional() @IsDateString() hysteroscopyDate?: string;
  @IsOptional() @IsString() hysteroscopyFindings?: string;
  @IsOptional() @IsDateString() returnDate?: string;
  @IsOptional() @IsString() notes?: string;

  @IsOptional() @IsArray() alerts?: Record<string, unknown>[];
}
