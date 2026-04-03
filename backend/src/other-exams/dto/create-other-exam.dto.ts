import { IsString, IsNotEmpty, IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class CreateOtherExamDto {
  @IsString() @IsNotEmpty() examName: string;
  @IsDateString() examDate: string;
  @IsOptional() @IsString() result?: string;
  @IsOptional() @IsBoolean() isAltered?: boolean;
  @IsOptional() @IsString() attachmentUrl?: string;
  @IsOptional() @IsString() notes?: string;
}
