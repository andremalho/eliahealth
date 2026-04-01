import {
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsObject,
  IsArray,
  Min,
} from 'class-validator';
import {
  SummaryExamType,
  SummaryAttachmentType,
  DopplerResult,
  MorphologyResult,
  CervicalLengthCategory,
  PresentAbsentEnum,
  EchoResult,
} from '../ultrasound-summary.enums.js';

export class CreateUltrasoundSummaryDto {
  @IsEnum(SummaryExamType)
  examType: SummaryExamType;

  @IsDateString()
  examDate: string;

  @IsOptional()
  @IsString()
  performedBy?: string;

  @IsOptional()
  @IsString()
  facilityName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fetalWeightGrams?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  fetalWeightPercentile?: number;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsEnum(SummaryAttachmentType)
  attachmentType?: SummaryAttachmentType;

  @IsOptional()
  @IsString()
  generalObservations?: string;

  @IsOptional()
  @IsObject()
  specificFindings?: Record<string, unknown>;

  // ── Campos específicos por tipo de exame ──
  // Aceitos no nível raiz e mesclados em specificFindings pelo service

  // Morfológico 1º e 2º tri + Ecodoppler
  @IsOptional()
  @IsEnum(DopplerResult)
  dopplerResult?: DopplerResult;

  @IsOptional()
  @IsObject()
  trisomyRisk?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  preeclampsiaRisk?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(MorphologyResult)
  morphologyResult?: MorphologyResult;

  @IsOptional()
  @IsObject()
  morphologyFindings?: Record<string, unknown>;

  // Morfológico 2º tri — colo uterino
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  cervicalLength?: number;

  @IsOptional()
  @IsEnum(CervicalLengthCategory)
  cervicalLengthCategory?: CervicalLengthCategory;

  @IsOptional()
  @IsEnum(PresentAbsentEnum)
  funneling?: PresentAbsentEnum;

  @IsOptional()
  @IsEnum(PresentAbsentEnum)
  sludge?: PresentAbsentEnum;

  @IsOptional()
  @IsEnum(PresentAbsentEnum)
  ege?: PresentAbsentEnum;

  // Ecodoppler fetal
  @IsOptional()
  @IsEnum(EchoResult)
  echoResult?: EchoResult;

  @IsOptional()
  @IsObject()
  echoFindings?: Record<string, unknown>;
}
