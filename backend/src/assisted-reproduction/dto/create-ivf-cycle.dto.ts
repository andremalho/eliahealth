import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  IVFCycleType,
  StimulationProtocol,
  TriggerType,
  FertilizationMethod,
  PGTType,
  TransferType,
  TechnicalDifficulty,
  OHSSGrade,
} from '../assisted-reproduction.enums.js';

export class CreateIvfCycleDto {
  @IsOptional() @IsUUID() partnerId?: string;
  @IsOptional() @IsUUID() doctorId?: string;
  @IsInt() @Min(1) cycleNumber: number;
  @IsEnum(IVFCycleType) cycleType: IVFCycleType;
  @IsEnum(StimulationProtocol) stimulationProtocol: StimulationProtocol;
  @IsOptional() @IsDateString() stimulationStartDate?: string;

  // Estimulação
  @IsOptional() @IsNumber() totalFSHDose?: number;
  @IsOptional() @IsInt() @Min(0) stimulationDays?: number;
  @IsOptional() @IsNumber() peakEstradiol?: number;
  @IsOptional() @IsEnum(TriggerType) triggerType?: TriggerType;
  @IsOptional() @IsDateString() triggerDate?: string;

  // Captação
  @IsOptional() @IsDateString() oocyteRetrievalDate?: string;
  @IsOptional() @IsInt() @Min(0) totalOocytesRetrieved?: number;
  @IsOptional() @IsInt() @Min(0) miiOocytes?: number;
  @IsOptional() @IsInt() @Min(0) miOocytes?: number;
  @IsOptional() @IsInt() @Min(0) gvOocytes?: number;
  @IsOptional() @IsInt() @Min(0) atretic?: number;

  // Fertilização
  @IsEnum(FertilizationMethod) fertilizationMethod: FertilizationMethod;
  @IsOptional() @IsInt() @Min(0) fertilized2PN?: number;
  @IsOptional() @IsNumber() fertilizationRate?: number;

  // Desenvolvimento
  @IsOptional() @IsInt() @Min(0) day3Embryos?: number;
  @IsOptional() @IsInt() @Min(0) blastocysts?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) blastoGrades?: string[];

  // PGT
  @IsOptional() @IsBoolean() pgtPerformed?: boolean;
  @IsOptional() @IsEnum(PGTType) pgtType?: PGTType;
  @IsOptional() @IsInt() @Min(0) euploidEmbryos?: number;

  // Crio
  @IsOptional() @IsInt() @Min(0) cryopreservedEmbryos?: number;
  @IsOptional() @IsDateString() cryopreservationDate?: string;

  // Transferência
  @IsOptional() @IsDateString() transferDate?: string;
  @IsOptional() @IsInt() @Min(0) embryosTransferred?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) embryoGradesTransferred?: string[];
  @IsOptional() @IsEnum(TransferType) transferType?: TransferType;
  @IsOptional() @IsNumber() endometrialThicknessAtTransfer?: number;
  @IsOptional() @IsString() lutealSupportProtocol?: string;
  @IsOptional() @IsEnum(TechnicalDifficulty) technicalDifficulty?: TechnicalDifficulty;

  // Desfecho
  @IsOptional() @IsBoolean() ovarianHyperstimulationSyndrome?: boolean;
  @IsOptional() @IsEnum(OHSSGrade) ohssGrade?: OHSSGrade;
  @IsOptional() @IsBoolean() ohssHospitalization?: boolean;
  @IsOptional() @IsDateString() betaHcgDate?: string;
  @IsOptional() @IsNumber() betaHcgValue?: number;
  @IsOptional() @IsBoolean() clinicalPregnancy?: boolean;
  @IsOptional() @IsBoolean() liveBirth?: boolean;
  @IsOptional() @IsBoolean() miscarriage?: boolean;
  @IsOptional() @IsString() cancelledReason?: string;
  @IsOptional() @IsInt() @Min(0) cumulativeEmbryosInStorage?: number;
  @IsOptional() @IsString() notes?: string;

  @IsOptional() @IsArray() alerts?: Record<string, unknown>[];
}
