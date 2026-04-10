import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { CreateAppointmentDto } from './create-appointment.dto.js';
import { AppointmentStatus } from '../appointment.enums.js';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
  @IsOptional() @IsString() cancellationReason?: string;
}
