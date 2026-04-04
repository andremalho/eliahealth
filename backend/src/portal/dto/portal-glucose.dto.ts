import { IsDateString, IsInt, IsString, IsMilitaryTime, Min, Max } from 'class-validator';

export class CreatePortalGlucoseDto {
  @IsDateString() date: string;
  @IsString() mealType: string;
  @IsInt() @Min(10) @Max(600) value: number;
  @IsMilitaryTime() measuredAt: string;
}
