import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsArray,
  Matches,
} from 'class-validator';
import { BloodTypeABO, BloodTypeRH, HemoglobinElectrophoresis } from '../patient.enums.js';

const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
] as const;

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 digitos numericos' })
  cpf: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(BLOOD_TYPES)
  bloodType?: string;

  @IsOptional()
  @IsEnum(BloodTypeABO)
  bloodTypeABO?: BloodTypeABO;

  @IsOptional()
  @IsEnum(BloodTypeRH)
  bloodTypeRH?: BloodTypeRH;

  @IsOptional()
  @IsEnum(HemoglobinElectrophoresis)
  hemoglobinElectrophoresis?: HemoglobinElectrophoresis;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  height?: number;

  @IsOptional()
  @IsString()
  comorbidities?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  comorbiditiesSelected?: string[];

  @IsOptional()
  @IsString()
  comorbiditiesNotes?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergiesSelected?: string[];

  @IsOptional()
  @IsString()
  allergiesNotes?: string;

  @IsOptional()
  @IsString()
  addictions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addictionsSelected?: string[];

  @IsOptional()
  @IsString()
  addictionsNotes?: string;

  @IsOptional()
  @IsString()
  surgeries?: string;

  @IsOptional()
  @IsString()
  familyHistory?: string;

  @IsOptional()
  @IsNumber()
  menarcheAge?: number;

  @IsOptional()
  @IsString()
  menstrualCycle?: string;

  @IsOptional()
  dysmenorrhea?: boolean;

  @IsOptional()
  @IsString()
  profileNotes?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsDateString()
  lgpdConsentAt?: string;
}
