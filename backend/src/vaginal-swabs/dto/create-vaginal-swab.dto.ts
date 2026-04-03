import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { SwabExamType } from '../vaginal-swab.entity.js';

export class CreateVaginalSwabDto {
  @IsDateString() collectionDate: string;
  @IsEnum(SwabExamType) examType: SwabExamType;
  @IsOptional() @IsString() result?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() labName?: string;
  @IsOptional() @IsString() attachmentUrl?: string;
}
