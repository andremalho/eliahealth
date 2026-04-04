import { IsDateString } from 'class-validator';

export class CreatePublicShareDto {
  @IsDateString() expiresAt: string;
}
