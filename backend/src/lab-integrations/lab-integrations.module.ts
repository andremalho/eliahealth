import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabIntegration } from './lab-integration.entity.js';
import { LabWebhookLog } from './lab-webhook-log.entity.js';
import { LabIntegrationsController } from './lab-integrations.controller.js';
import { LabIntegrationsService } from './lab-integrations.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([LabIntegration, LabWebhookLog])],
  controllers: [LabIntegrationsController],
  providers: [LabIntegrationsService],
  exports: [LabIntegrationsService],
})
export class LabIntegrationsModule {}
