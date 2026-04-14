import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeliveryChannel } from '../enums/delivery-channel.enum.js';

export class UpdateConsultationSummaryDto {
  @IsOptional()
  @IsString()
  summaryText?: string;

  @IsOptional()
  @IsEnum(DeliveryChannel)
  deliveryChannel?: DeliveryChannel;
}
