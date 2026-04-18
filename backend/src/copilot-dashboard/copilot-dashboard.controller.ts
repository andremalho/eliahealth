import { Controller, Get } from '@nestjs/common';
import { CopilotDashboardService } from './copilot-dashboard.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('copilot-dashboard')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class CopilotDashboardController {
  constructor(private readonly service: CopilotDashboardService) {}

  @Get()
  getDashboard(
    @CurrentUser('userId') doctorId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getDashboardData(doctorId, tenantId);
  }
}
