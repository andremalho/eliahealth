import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateFileDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isVisibleToPatient?: boolean;
}
