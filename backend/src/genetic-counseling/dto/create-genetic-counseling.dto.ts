import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsArray,
  IsObject,
} from 'class-validator';
import {
  NiptResult,
  KaryotypeMethod,
  KaryotypeClassification,
  GenomicResult,
  ExomeType,
} from '../genetic-counseling.enums.js';

export class CreateGeneticCounselingDto {
  @IsOptional()
  @IsUUID()
  ultrasoundSummaryId?: string;

  @IsDateString()
  counselingDate: string;

  @IsString()
  @IsNotEmpty()
  indicationReason: string;

  @IsOptional()
  @IsString()
  geneticistName?: string;

  // ── NIPT ──

  @IsOptional()
  @IsDateString()
  niptDate?: string;

  @IsOptional()
  @IsString()
  niptLab?: string;

  @IsOptional()
  @IsString()
  niptT21Risk?: string;

  @IsOptional()
  @IsEnum(NiptResult)
  niptT21Result?: NiptResult;

  @IsOptional()
  @IsEnum(NiptResult)
  niptT18Result?: NiptResult;

  @IsOptional()
  @IsEnum(NiptResult)
  niptT13Result?: NiptResult;

  @IsOptional()
  @IsString()
  niptSexChromosomes?: string;

  @IsOptional()
  @IsObject()
  niptMicrodeletions?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  niptRawReport?: string;

  // ── Cariótipo ──

  @IsOptional()
  @IsDateString()
  karyotypeDate?: string;

  @IsOptional()
  @IsString()
  karyotypeLab?: string;

  @IsOptional()
  @IsEnum(KaryotypeMethod)
  karyotypeMethod?: KaryotypeMethod;

  @IsOptional()
  @IsString()
  karyotypeResult?: string;

  @IsOptional()
  @IsEnum(KaryotypeClassification)
  karyotypeClassification?: KaryotypeClassification;

  @IsOptional()
  @IsString()
  karyotypeFindings?: string;

  // ── Microarray ──

  @IsOptional()
  @IsDateString()
  microarrayDate?: string;

  @IsOptional()
  @IsString()
  microarrayLab?: string;

  @IsOptional()
  @IsString()
  microarrayPlatform?: string;

  @IsOptional()
  @IsEnum(GenomicResult)
  microarrayResult?: GenomicResult;

  @IsOptional()
  @IsString()
  microarrayFindings?: string;

  @IsOptional()
  @IsString()
  microarrayRawReport?: string;

  // ── Exoma ──

  @IsOptional()
  @IsDateString()
  exomeDate?: string;

  @IsOptional()
  @IsString()
  exomeLab?: string;

  @IsOptional()
  @IsEnum(ExomeType)
  exomeType?: ExomeType;

  @IsOptional()
  @IsEnum(GenomicResult)
  exomeResult?: GenomicResult;

  @IsOptional()
  @IsString()
  exomeGene?: string;

  @IsOptional()
  @IsString()
  exomeVariant?: string;

  @IsOptional()
  @IsString()
  exomeFindings?: string;

  @IsOptional()
  @IsString()
  exomeRawReport?: string;

  // ── Conclusão ──

  @IsOptional()
  @IsString()
  overallConclusion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendedActions?: string[];

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}
