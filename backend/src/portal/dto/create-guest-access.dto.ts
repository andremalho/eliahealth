import { IsEnum, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { InviteMethod, GuestAccessType } from '../guest-access.entity.js';

export class CreateGuestAccessDto {
  @IsEnum(InviteMethod) inviteMethod: InviteMethod;
  @IsString() inviteContact: string;
  @IsOptional() @IsEnum(GuestAccessType) accessType?: GuestAccessType;
  @IsOptional() @IsBoolean() showWeightChart?: boolean;
  @IsOptional() @IsDateString() expiresAt?: string;
}
