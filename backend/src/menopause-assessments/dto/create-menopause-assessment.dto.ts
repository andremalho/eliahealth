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
  STRAWStage,
  MenopauseType,
  HotFlashIntensity,
  OsteoporosisClassification,
  CardioRisk,
  HRTScheme,
  EstrogenRoute,
} from '../menopause-assessment.enums.js';

export class CreateMenopauseAssessmentDto {
  @IsOptional() @IsUUID() doctorId?: string;
  @IsDateString() assessmentDate: string;

  @IsEnum(STRAWStage) strawStage: STRAWStage;
  @IsOptional() @IsDateString() menopauseDate?: string;
  @IsEnum(MenopauseType) menopauseType: MenopauseType;
  @IsOptional() @IsInt() @Min(0) @Max(120) ageAtMenopause?: number;

  // MRS (0-4)
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsHotFlashes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsHeartPalpitations?: number;
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsSleepDisorders?: number;
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsJointMuscleDiscomfort?: number;
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsDepressiveMood?: number;
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsIrritability?: number;
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsAnxiety?: number;
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsPhysicalMentalExhaustion?: number;
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsSexualProblems?: number;
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsBladderProblems?: number;
  @IsOptional() @IsInt() @Min(0) @Max(4) mrsDrynessVagina?: number;
  // mrsTotalScore é calculado pelo service

  // Fogachos
  @IsOptional() @IsInt() @Min(0) hotFlashesPerDay?: number;
  @IsOptional() @IsInt() @Min(0) hotFlashesPerNight?: number;
  @IsOptional() @IsEnum(HotFlashIntensity) hotFlashIntensity?: HotFlashIntensity;

  // GSM
  @IsOptional() @IsBoolean() gsmDiagnosis?: boolean;
  @IsOptional() @IsBoolean() gsmVaginalDryness?: boolean;
  @IsOptional() @IsBoolean() gsmDyspareunia?: boolean;
  @IsOptional() @IsBoolean() gsmRecurrentUTI?: boolean;
  @IsOptional() @IsBoolean() gsmUrinaryIncontinence?: boolean;
  @IsOptional() @IsBoolean() gsmVulvarAtrophy?: boolean;
  @IsOptional() @IsNumber() phMeterResult?: number;

  // Saúde óssea
  @IsOptional() @IsNumber() dexaLumbarTScore?: number;
  @IsOptional() @IsNumber() dexaFemoralNeckTScore?: number;
  @IsOptional() @IsNumber() dexaTotalHipTScore?: number;
  @IsOptional() @IsDateString() dexaDate?: string;
  @IsOptional() @IsEnum(OsteoporosisClassification) osteoporosisClassification?: OsteoporosisClassification;
  @IsOptional() @IsNumber() fraxScore10yrMajor?: number;
  @IsOptional() @IsNumber() fraxScore10yrHip?: number;

  // Cardiovascular
  @IsOptional() @IsNumber() framinghamScore?: number;
  @IsOptional() @IsEnum(CardioRisk) cardioRiskCategory?: CardioRisk;

  // Labs
  @IsOptional() @IsObject() labs?: Record<string, unknown>;

  // THM
  @IsOptional() @IsBoolean() hrtIndicated?: boolean;
  @IsOptional() @IsBoolean() hrtContraindicated?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) hrtContraindicationReasons?: string[];
  @IsOptional() @IsEnum(HRTScheme) hrtScheme?: HRTScheme;
  @IsOptional() @IsEnum(EstrogenRoute) estrogenRoute?: EstrogenRoute;
  @IsOptional() @IsString() estrogenDrug?: string;
  @IsOptional() @IsString() progestogenDrug?: string;
  @IsOptional() @IsDateString() hrtStartDate?: string;
  @IsOptional() @IsDateString() hrtReviewDate?: string;
  @IsOptional() @IsString() hrtSideEffects?: string;

  // Não-hormonal
  @IsOptional() @IsArray() @IsString({ each: true }) nonHormonalTherapy?: string[];

  // Osteoporose
  @IsOptional() @IsString() osteoporosisTreatment?: string;
  @IsOptional() @IsNumber() calciumSupplementation?: number;
  @IsOptional() @IsNumber() vitaminDSupplementation?: number;
  @IsOptional() @IsNumber() vitaminDLevel?: number;

  // Cognitiva
  @IsOptional() @IsInt() @Min(0) @Max(30) mmsScore?: number;
  @IsOptional() @IsInt() @Min(0) @Max(30) mocaScore?: number;
  @IsOptional() @IsBoolean() cognitiveComplaint?: boolean;
  @IsOptional() @IsBoolean() cognitiveReferral?: boolean;

  // Sexual
  @IsOptional() @IsNumber() fsfiScore?: number;
  @IsOptional() @IsBoolean() sexualDysfunction?: boolean;
  @IsOptional() @IsString() sexualDysfunctionType?: string;

  // Conduta
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) icd10Codes?: string[];
  @IsOptional() @IsString() treatmentPlan?: string;
  @IsOptional() @IsDateString() nextDexaDate?: string;
  @IsOptional() @IsDateString() nextMammographyDate?: string;
  @IsOptional() @IsDateString() returnDate?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() internalNotes?: string;

  @IsOptional() @IsArray() alerts?: Record<string, unknown>[];
}
