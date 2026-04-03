import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateDashboardDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
