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
  Max,
  Min,
} from 'class-validator';
import {
  GynecologyConsultationType,
  MenstrualVolume,
  DysmenorrheaGrade,
  SmokingStatus,
  PhysicalActivityLevel,
  EndometriosisStage,
  BiRads,
  GynecologyAlert,
} from '../gynecology-consultation.enums.js';

export class CreateGynecologyConsultationDto {
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsDateString()
  consultationDate: string;

  @IsOptional()
  @IsEnum(GynecologyConsultationType)
  consultationType?: GynecologyConsultationType;

  // ── Anamnese ──
  @IsOptional() @IsString() chiefComplaint?: string;
  @IsOptional() @IsString() currentIllnessHistory?: string;
  @IsOptional() @IsDateString() lastMenstrualPeriod?: string;
  @IsOptional() @IsInt() @Min(10) @Max(120) cycleInterval?: number;
  @IsOptional() @IsInt() @Min(1) @Max(30) cycleDuration?: number;
  @IsOptional() @IsEnum(MenstrualVolume) cycleVolume?: MenstrualVolume;
  @IsOptional() @IsEnum(DysmenorrheaGrade) dysmenorrhea?: DysmenorrheaGrade;
  @IsOptional() @IsDateString() lastPapSmear?: string;
  @IsOptional() @IsString() lastPapSmearResult?: string;
  @IsOptional() @IsDateString() lastMammography?: string;
  @IsOptional() @IsString() lastMammographyResult?: string;
  @IsOptional() @IsString() contraceptiveMethod?: string;
  @IsOptional() @IsBoolean() sexuallyActive?: boolean;
  @IsOptional() @IsInt() @Min(0) numberOfSexualPartners?: number;
  @IsOptional() @IsBoolean() historyOfSTI?: boolean;
  @IsOptional() @IsString() historyOfSTIDetails?: string;
  @IsOptional() @IsEnum(SmokingStatus) smokingStatus?: SmokingStatus;
  @IsOptional() @IsNumber() smokingPacksPerYear?: number;
  @IsOptional() @IsBoolean() alcoholUse?: boolean;
  @IsOptional() @IsEnum(PhysicalActivityLevel) physicalActivity?: PhysicalActivityLevel;

  // ── Antecedentes ginecológicos ──
  @IsOptional() @IsString() previousGynecologicSurgeries?: string;
  @IsOptional() @IsBoolean() historyOfEndometriosis?: boolean;
  @IsOptional() @IsEnum(EndometriosisStage) endometriosisStage?: EndometriosisStage;
  @IsOptional() @IsBoolean() historyOfMyoma?: boolean;
  @IsOptional() @IsBoolean() historyOfOvarianCyst?: boolean;
  @IsOptional() @IsBoolean() historyOfPCOS?: boolean;
  @IsOptional() @IsBoolean() historyOfHPV?: boolean;
  @IsOptional() @IsBoolean() historyOfCervicalDysplasia?: boolean;

  // ── Antecedentes obstétricos ──
  @IsOptional() @IsInt() @Min(0) gravida?: number;
  @IsOptional() @IsInt() @Min(0) para?: number;
  @IsOptional() @IsInt() @Min(0) abortus?: number;
  @IsOptional() @IsInt() @Min(0) cesarean?: number;

  // ── Antecedentes familiares ──
  @IsOptional() @IsBoolean() familyHistoryBreastCancer?: boolean;
  @IsOptional() @IsBoolean() familyHistoryOvarianCancer?: boolean;
  @IsOptional() @IsBoolean() familyHistoryEndometrialCancer?: boolean;
  @IsOptional() @IsBoolean() familyHistoryColorectalCancer?: boolean;
  @IsOptional() @IsBoolean() familyHistoryDiabetes?: boolean;
  @IsOptional() @IsBoolean() familyHistoryCardiovascularDisease?: boolean;
  @IsOptional() @IsBoolean() familyHistoryThrombosis?: boolean;
  @IsOptional() @IsString() familyHistoryDetails?: string;

  // ── Saúde mental ──
  @IsOptional() @IsInt() @Min(0) @Max(6) phq2Score?: number;
  @IsOptional() @IsInt() @Min(0) @Max(6) gad2Score?: number;
  @IsOptional() @IsString() mentalHealthNotes?: string;

  // ── Exame físico ──
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsNumber() bmi?: number;
  @IsOptional() @IsNumber() waistCircumference?: number;
  @IsOptional() @IsInt() @Min(40) @Max(300) bloodPressureSystolic?: number;
  @IsOptional() @IsInt() @Min(20) @Max(200) bloodPressureDiastolic?: number;
  @IsOptional() @IsInt() @Min(20) @Max(250) heartRate?: number;
  @IsOptional() @IsNumber() temperature?: number;
  @IsOptional() @IsString() thyroidExam?: string;
  @IsOptional() @IsString() lymphNodeExam?: string;
  @IsOptional() @IsBoolean() signsOfHyperandrogenism?: boolean;
  @IsOptional() @IsString() hyperandrogenismDetails?: string;

  // ── Exame mamário ──
  @IsOptional() @IsBoolean() breastExamPerformed?: boolean;
  @IsOptional() @IsBoolean() breastExamNormal?: boolean;
  @IsOptional() @IsString() breastExamFindings?: string;
  @IsOptional() @IsEnum(BiRads) biradsClassification?: BiRads;

  // ── Exame ginecológico ──
  @IsOptional() @IsBoolean() pelvicExamPerformed?: boolean;
  @IsOptional() @IsBoolean() vulvarExamNormal?: boolean;
  @IsOptional() @IsString() vulvarFindings?: string;
  @IsOptional() @IsBoolean() speculoscopyPerformed?: boolean;
  @IsOptional() @IsString() cervixAppearance?: string;
  @IsOptional() @IsBoolean() papSmearCollected?: boolean;
  @IsOptional() @IsBoolean() bimanualExamNormal?: boolean;
  @IsOptional() @IsString() uterineSize?: string;
  @IsOptional() @IsString() adnexalFindings?: string;
  @IsOptional() @IsString() pelvicFloorAssessment?: string;

  // ── Rastreamento oncológico ──
  @IsOptional() @IsObject() cancerScreeningPerformed?: Record<string, unknown>;

  // ── Conduta ──
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) icd10Codes?: string[];
  @IsOptional() @IsObject() requestedExams?: Record<string, unknown>;
  @IsOptional() @IsObject() prescriptions?: Record<string, unknown>;
  @IsOptional() @IsString() referrals?: string;
  @IsOptional() @IsDateString() returnDate?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() internalNotes?: string;

  @IsOptional() @IsArray() alerts?: GynecologyAlert[];
}
