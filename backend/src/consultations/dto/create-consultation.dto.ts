import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsObject,
  IsIn,
} from 'class-validator';
import {
  EdemaGrade, FetalPresentation, UmbilicalDopplerResult,
  CervicalPosition, CervicalConsistency, CervicalState, FetalStation, Membranes, FhrStatus,
} from '../consultation.enums.js';

export class CreateConsultationDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(250)
  bpSystolic?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(150)
  bpDiastolic?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(5)
  @Max(50)
  fundalHeightCm?: number;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(220)
  fetalHeartRate?: number;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(220)
  fhrValue?: number;

  @IsOptional()
  @IsEnum(FhrStatus)
  fhrStatus?: FhrStatus;

  @IsOptional()
  @IsEnum(EdemaGrade)
  edemaGrade?: EdemaGrade;

  @IsOptional()
  @IsString()
  subjective?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsObject()
  aiSuggestions?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  fetalMovements?: string;

  @IsOptional()
  @IsString()
  vaginalExam?: string;

  // Structured cervical exam
  @IsOptional()
  @IsEnum(CervicalState)
  cervicalState?: CervicalState;

  @IsOptional()
  @IsEnum(CervicalPosition)
  cervicalPosition?: CervicalPosition;

  @IsOptional()
  @IsEnum(CervicalConsistency)
  cervicalConsistency?: CervicalConsistency;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  cervicalDilation?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  cervicalEffacement?: number;

  @IsOptional()
  @IsEnum(FetalStation)
  fetalStation?: FetalStation;

  @IsOptional()
  @IsEnum(Membranes)
  membranes?: Membranes;

  @IsOptional()
  @IsEnum(FetalPresentation)
  fetalPresentation?: FetalPresentation;

  @IsOptional()
  @IsString()
  estimatedFetalWeight?: string;

  @IsOptional()
  @IsEnum(UmbilicalDopplerResult)
  umbilicalDoppler?: UmbilicalDopplerResult;

  @IsOptional()
  @IsInt()
  @IsIn([2, 4, 6, 8, 10])
  biophysicalProfile?: number;

  @IsOptional()
  @IsString()
  physicalExamNotes?: string;

  @IsOptional()
  @IsDateString()
  nextAppointmentDate?: string;

  @IsOptional()
  @IsString()
  confidentialNotes?: string;
}
