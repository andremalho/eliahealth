import { IsEmail, IsDateString } from 'class-validator';

export class PatientLoginDto {
  @IsEmail()
  email: string;

  @IsDateString()
  dateOfBirth: string;
}
