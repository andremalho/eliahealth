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
  OIIndication,
  OIProtocol,
  OICycleOutcome,
  TriggerType,
  OHSSGrade,
} from '../assisted-reproduction.enums.js';

export class CreateOvulationInductionCycleDto {
  @IsOptional() @IsUUID() doctorId?: string;
  @IsInt() @Min(1) cycleNumber: number;
  @IsDateString() cycleStartDate: string;
  @IsEnum(OIIndication) indication: OIIndication;
  @IsEnum(OIProtocol) protocol: OIProtocol;
  @IsNumber() startingDose: number;
  @IsString() startingDoseUnit: string;

  @IsOptional() @IsEnum(TriggerType) triggerType?: TriggerType;
  @IsOptional() @IsNumber() triggerDose?: number;
  @IsOptional() @IsDateString() triggerDate?: string;
  @IsOptional() @IsString() triggerTime?: string;

  @IsOptional() @IsArray() monitoringVisits?: Record<string, unknown>[];

  @IsOptional() @IsEnum(OICycleOutcome) outcomeType?: OICycleOutcome;
  @IsOptional() @IsInt() @Min(0) folliclesAtTrigger?: number;
  @IsOptional() @IsNumber() endometrialThicknessAtTrigger?: number;
  @IsOptional() @IsNumber() estradiolAtTrigger?: number;
  @IsOptional() @IsBoolean() ovarianHyperstimulationSyndrome?: boolean;
  @IsOptional() @IsEnum(OHSSGrade) ohssGrade?: OHSSGrade;
  @IsOptional() @IsString() cancellationReason?: string;
  @IsOptional() @IsBoolean() pregnancyTest?: boolean;
  @IsOptional() @IsDateString() pregnancyTestDate?: string;
  @IsOptional() @IsNumber() betaHcgValue?: number;
  @IsOptional() @IsBoolean() clinicalPregnancy?: boolean;
  @IsOptional() @IsString() notes?: string;

  @IsOptional() @IsArray() alerts?: Record<string, unknown>[];
}
