import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateAnnotationDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) content: string;
  @IsOptional() @IsBoolean() isVisibleToPatient?: boolean;
  @IsOptional() @IsBoolean() isVisibleToTeam?: boolean;
}
