import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { PregnancyFileType } from '../pregnancy-file.entity.js';

export class CreateFileDto {
  @IsString() @IsNotEmpty() fileName: string;
  @IsEnum(PregnancyFileType) fileType: PregnancyFileType;
  @IsString() @IsNotEmpty() mimeType: string;
  @IsInt() @Min(0) fileSize: number;
  @IsString() @IsNotEmpty() fileUrl: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isVisibleToPatient?: boolean;
}
