import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PregnancyDashboardService } from './pregnancy-dashboard.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class PregnancyDashboardController {
  constructor(private readonly service: PregnancyDashboardService) {}

  @Get('pregnancies/:id/dashboard-summary')
  getDashboardSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getDashboardSummary(id);
  }
}
