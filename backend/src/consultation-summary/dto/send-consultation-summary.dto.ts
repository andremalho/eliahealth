import { IsEnum, IsOptional } from 'class-validator';
import { DeliveryChannel } from '../enums/delivery-channel.enum.js';

export class SendConsultationSummaryDto {
  @IsOptional()
  @IsEnum(DeliveryChannel)
  channel?: DeliveryChannel;
}
