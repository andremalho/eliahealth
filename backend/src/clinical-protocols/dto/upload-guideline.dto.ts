import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadGuidelineDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsOptional()
  @IsString()
  description?: string;
}
