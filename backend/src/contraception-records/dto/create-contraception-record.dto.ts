import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  ContraceptiveMethod,
  ReproductiveDesire,
  WHOMECCategory,
} from '../contraception-record.enums.js';
import { SmokingStatus } from '../../gynecology-consultations/gynecology-consultation.enums.js';

export class CreateContraceptionRecordDto {
  @IsOptional() @IsUUID() doctorId?: string;

  @IsDateString()
  consultationDate: string;

  // Situação atual
  @IsOptional() @IsEnum(ContraceptiveMethod) currentMethod?: ContraceptiveMethod;
  @IsOptional() @IsDateString() currentMethodStartDate?: string;
  @IsOptional() @IsString() currentMethodDetails?: string;

  @IsOptional() @IsArray() previousMethods?: Record<string, unknown>[];

  // Desejo reprodutivo
  @IsEnum(ReproductiveDesire)
  desireForPregnancy: ReproductiveDesire;

  @IsOptional() @IsBoolean() breastfeeding?: boolean;

  // OMS MEC
  @IsOptional() @IsEnum(WHOMECCategory) whomecCategory?: WHOMECCategory;
  @IsOptional() @IsArray() whomecConditions?: Record<string, unknown>[];
  @IsOptional() @IsArray() @IsString({ each: true }) contraindications?: string[];

  // Fatores de risco
  @IsOptional() @IsEnum(SmokingStatus) smokingStatus?: SmokingStatus;
  @IsOptional() @IsBoolean() smokingAge35Plus?: boolean;
  @IsOptional() @IsBoolean() historyOfVTE?: boolean;
  @IsOptional() @IsBoolean() thrombophilia?: boolean;
  @IsOptional() @IsString() thrombophiliaDetails?: string;
  @IsOptional() @IsBoolean() migraineWithAura?: boolean;
  @IsOptional() @IsBoolean() uncontrolledHypertension?: boolean;
  @IsOptional() @IsBoolean() diabetesWith15yearsPlus?: boolean;
  @IsOptional() @IsBoolean() breastCancerHistory?: boolean;
  @IsOptional() @IsBoolean() liverDisease?: boolean;
  @IsOptional() @IsBoolean() cardiovascularDisease?: boolean;
  @IsOptional() @IsBoolean() stroke?: boolean;

  // DIU
  @IsOptional() @IsDateString() iudInsertionDate?: string;
  @IsOptional() @IsDateString() iudExpirationDate?: string;
  @IsOptional() @IsString() iudPositionUltrasound?: string;
  @IsOptional() @IsDateString() iudNextCheckDate?: string;
  @IsOptional() @IsDateString() iudRemovalDate?: string;
  @IsOptional() @IsString() iudRemovalReason?: string;

  // Implante
  @IsOptional() @IsDateString() implantInsertionDate?: string;
  @IsOptional() @IsDateString() implantExpirationDate?: string;
  @IsOptional() @IsString() implantLocation?: string;
  @IsOptional() @IsDateString() implantRemovalDate?: string;

  // PAE
  @IsOptional() @IsBoolean() emergencyContraceptionUsed?: boolean;
  @IsOptional() @IsDateString() emergencyContraceptionDate?: string;
  @IsOptional() @IsString() emergencyContraceptionMethod?: string;
  @IsOptional() @IsString() emergencyContraceptionReason?: string;

  // Conduta
  @IsOptional() @IsEnum(ContraceptiveMethod) methodPrescribed?: ContraceptiveMethod;
  @IsOptional() @IsString() methodPrescribedDetails?: string;
  @IsOptional() @IsBoolean() counselingProvided?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) counselingTopics?: string[];
  @IsOptional() @IsDateString() returnDate?: string;
  @IsOptional() @IsString() notes?: string;

  @IsOptional() @IsArray() alerts?: Record<string, unknown>[];
}
