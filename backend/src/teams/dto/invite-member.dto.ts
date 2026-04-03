import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import { TeamRole } from '../teams.enums.js';

export class InviteMemberDto {
  @IsUUID() memberId: string;
  @IsEnum(TeamRole) role: TeamRole;
  @IsOptional() @IsString() specialty?: string;
}
