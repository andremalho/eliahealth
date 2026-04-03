import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { IntegrationProtocol } from '../glucose-monitoring.enums.js';

export class DeviceConfigDto {
  @IsOptional()
  @IsString()
  deviceBrand?: string;

  @IsOptional()
  @IsString()
  deviceModel?: string;

  @IsOptional()
  @IsString()
  deviceSerialNumber?: string;

  @IsOptional()
  @IsEnum(IntegrationProtocol)
  integrationProtocol?: IntegrationProtocol;

  @IsOptional()
  @IsString()
  integrationApiKey?: string;

  @IsOptional()
  @IsBoolean()
  autoSyncEnabled?: boolean;
}
