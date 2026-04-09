import {
  IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsDateString,
  Min, Max, ValidateNested, IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  LochiaType, LochiaAmount, WoundStatus, UterineInvolution,
  BreastfeedingStatus, BreastCondition, MoodScreening,
} from '../postpartum-consultation.entity.js';

class NewbornDataDto {
  @IsOptional() @IsNumber() @Min(500) @Max(10000) currentWeight?: number;
  @IsOptional() @IsBoolean() feedingWell?: boolean;
  @IsOptional() @IsBoolean() jaundice?: boolean;
  @IsOptional() @IsString() umbilicalStump?: string;
  @IsOptional() @IsString() skinColor?: string;
  @IsOptional() @IsBoolean() vaccinesUpToDate?: boolean;
  @IsOptional() @IsBoolean() heelPrickDone?: boolean;
  @IsOptional() @IsBoolean() hearingScreenDone?: boolean;
  @IsOptional() @IsBoolean() redReflexDone?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class CreatePostpartumConsultationDto {
  @IsDateString()
  date: string;

  // Vitals
  @IsOptional() @IsNumber() @Min(20) @Max(300) weightKg?: number;
  @IsOptional() @IsNumber() @Min(50) @Max(250) bpSystolic?: number;
  @IsOptional() @IsNumber() @Min(30) @Max(150) bpDiastolic?: number;
  @IsOptional() @IsNumber() @Min(34) @Max(42) temperature?: number;
  @IsOptional() @IsNumber() @Min(40) @Max(200) heartRate?: number;

  // Uterus & Lochia
  @IsOptional() @IsEnum(UterineInvolution) uterineInvolution?: UterineInvolution;
  @IsOptional() @IsNumber() @Min(0) @Max(30) fundalHeightCm?: number;
  @IsOptional() @IsEnum(LochiaType) lochiaType?: LochiaType;
  @IsOptional() @IsEnum(LochiaAmount) lochiaAmount?: LochiaAmount;
  @IsOptional() @IsBoolean() lochiaOdor?: boolean;

  // Wound
  @IsOptional() @IsEnum(WoundStatus) woundStatus?: WoundStatus;
  @IsOptional() @IsString() woundNotes?: string;

  // Breastfeeding
  @IsOptional() @IsEnum(BreastfeedingStatus) breastfeedingStatus?: BreastfeedingStatus;
  @IsOptional() @IsEnum(BreastCondition) breastCondition?: BreastCondition;
  @IsOptional() @IsString() breastfeedingNotes?: string;

  // Mental Health
  @IsOptional() @IsEnum(MoodScreening) moodScreening?: MoodScreening;
  @IsOptional() @IsNumber() @Min(0) @Max(30) epdsScore?: number;
  @IsOptional() @IsString() moodNotes?: string;

  // Contraception
  @IsOptional() @IsBoolean() contraceptionDiscussed?: boolean;
  @IsOptional() @IsString() contraceptionMethod?: string;

  // Newborn
  @IsOptional() @IsObject() @ValidateNested() @Type(() => NewbornDataDto) newbornData?: NewbornDataDto;

  // SOAP
  @IsOptional() @IsString() subjective?: string;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsString() assessment?: string;
  @IsOptional() @IsString() plan?: string;
  @IsOptional() @IsString() confidentialNotes?: string;
  @IsOptional() @IsDateString() nextAppointmentDate?: string;
}
