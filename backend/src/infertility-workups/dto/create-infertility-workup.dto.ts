import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  InfertilityDefinition,
  OvulatoryStatus,
  WHOOvulationGroup,
  InfertilityDiagnosis,
  FertilityPreservationIndication,
  InfertilityTreatment,
} from '../infertility-workup.enums.js';

export class CreateInfertilityWorkupDto {
  @IsOptional() @IsUUID() partnerId?: string;
  @IsOptional() @IsUUID() doctorId?: string;

  @IsDateString()
  workupDate: string;

  @IsEnum(InfertilityDefinition)
  infertilityDefinition: InfertilityDefinition;

  @IsInt() @Min(0) durationMonths: number;
  @IsInt() @Min(0) @Max(120) ageAtPresentation: number;

  @IsOptional() @IsBoolean() expeditedEvaluation?: boolean;
  @IsOptional() @IsBoolean() immediateEvaluation?: boolean;

  // Fator ovulatório
  @IsOptional() @IsBoolean() ovulatoryFactor?: boolean;
  @IsOptional() @IsEnum(OvulatoryStatus) ovulatoryStatus?: OvulatoryStatus;
  @IsOptional() @IsEnum(WHOOvulationGroup) whoGroupOvulation?: WHOOvulationGroup;

  // Reserva ovariana
  @IsOptional() @IsObject() ovarianReserve?: Record<string, unknown>;

  // Fator tubário/uterino
  @IsOptional() @IsBoolean() tubalFactor?: boolean;
  @IsOptional() @IsObject() hsg?: Record<string, unknown>;
  @IsOptional() @IsObject() hyCoSy?: Record<string, unknown>;
  @IsOptional() @IsObject() diagnosticHysteroscopy?: Record<string, unknown>;
  @IsOptional() @IsObject() pelvicMRI?: Record<string, unknown>;
  @IsOptional() @IsObject() laparoscopyDiagnostic?: Record<string, unknown>;
  @IsOptional() @IsBoolean() mullerianAnomaly?: boolean;
  @IsOptional() @IsString() mullerianAnomalyType?: string;

  // Fator masculino
  @IsOptional() @IsBoolean() maleFactor?: boolean;
  @IsOptional() @IsObject() semenAnalysis?: Record<string, unknown>;
  @IsOptional() @IsObject() dnaFragmentation?: Record<string, unknown>;
  @IsOptional() @IsBoolean() maleFertilitySpecialistReferral?: boolean;

  // Diagnóstico
  @IsOptional() @IsEnum(InfertilityDiagnosis) primaryDiagnosis?: InfertilityDiagnosis;
  @IsOptional() @IsArray() @IsString({ each: true }) secondaryDiagnoses?: string[];

  // Preservação
  @IsOptional() @IsBoolean() fertilityPreservation?: boolean;
  @IsOptional() @IsEnum(FertilityPreservationIndication) preservationIndication?: FertilityPreservationIndication;
  @IsOptional() @IsString() preservationMethod?: string;
  @IsOptional() @IsDateString() preservationDate?: string;
  @IsOptional() @IsString() preservationDetails?: string;

  // Tratamento
  @IsOptional() @IsEnum(InfertilityTreatment) treatmentPlan?: InfertilityTreatment;
  @IsOptional() @IsBoolean() referralToART?: boolean;
  @IsOptional() @IsString() artClinicName?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() returnDate?: string;

  @IsOptional() @IsArray() alerts?: Record<string, unknown>[];
}
