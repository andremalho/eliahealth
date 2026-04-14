import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('analytics')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get()
  getAnalytics(
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const defaultTo = now.toISOString().split('T')[0];
    return this.service.getAnalytics(
      tenantId,
      from ?? defaultFrom,
      to ?? defaultTo,
      doctorId,
    );
  }
}
