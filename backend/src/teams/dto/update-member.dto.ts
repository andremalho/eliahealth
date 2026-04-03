import { IsEnum, IsOptional, IsBoolean, IsString } from 'class-validator';
import { TeamRole } from '../teams.enums.js';

export class UpdateMemberDto {
  @IsOptional() @IsEnum(TeamRole) role?: TeamRole;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
