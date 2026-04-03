import { IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { SharePermission } from '../teams.enums.js';

export class SharePregnancyDto {
  @IsUUID() sharedWith: string;
  @IsEnum(SharePermission) permission: SharePermission;
  @IsOptional() @IsDateString() expiresAt?: string;
}
