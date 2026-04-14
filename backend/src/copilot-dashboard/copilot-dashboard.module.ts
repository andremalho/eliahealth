import { Module } from '@nestjs/common';
import { CopilotDashboardService } from './copilot-dashboard.service.js';
import { CopilotDashboardController } from './copilot-dashboard.controller.js';

@Module({
  controllers: [CopilotDashboardController],
  providers: [CopilotDashboardService],
})
export class CopilotDashboardModule {}
