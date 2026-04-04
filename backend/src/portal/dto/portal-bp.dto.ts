import { IsDateString, IsInt, IsOptional, IsString, IsMilitaryTime, Min, Max } from 'class-validator';

export class CreatePortalBpDto {
  @IsDateString() date: string;
  @IsMilitaryTime() time: string;
  @IsInt() @Min(50) @Max(250) systolic: number;
  @IsInt() @Min(30) @Max(150) diastolic: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() method?: string;
}
