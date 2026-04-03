import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PregnancyDashboardService } from './pregnancy-dashboard.service.js';

@Controller()
export class PregnancyDashboardController {
  constructor(private readonly service: PregnancyDashboardService) {}

  @Get('pregnancies/:id/dashboard-summary')
  getDashboardSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getDashboardSummary(id);
  }
}
