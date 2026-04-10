import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsUUID, Matches } from 'class-validator';
import { AppointmentType } from '../appointment.enums.js';

export class CreateAppointmentDto {
  @IsUUID() @IsNotEmpty() patientId: string;
  @IsUUID() @IsNotEmpty() doctorId: string;
  @IsDateString() date: string;
  @IsString() @Matches(/^\d{2}:\d{2}$/, { message: 'startTime deve estar no formato HH:mm' }) startTime: string;
  @IsString() @Matches(/^\d{2}:\d{2}$/, { message: 'endTime deve estar no formato HH:mm' }) endTime: string;
  @IsOptional() @IsEnum(AppointmentType) type?: AppointmentType;
  @IsOptional() @IsString() notes?: string;
}
