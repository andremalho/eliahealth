import { Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { DashboardStatsService } from './dashboard-stats.service.js';
import { ResearchQueryService } from './research-query.service.js';
import { CreateDashboardDto } from './dto/create-dashboard.dto.js';
import { CreateWidgetDto } from './dto/create-widget.dto.js';
import { UpdateWidgetDto } from './dto/update-widget.dto.js';
import { AskQuestionDto } from './dto/ask-question.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('research')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.RESEARCHER)
export class DashboardController {
  constructor(
    private readonly dashService: DashboardService,
    private readonly statsService: DashboardStatsService,
    private readonly queryService: ResearchQueryService,
  ) {}

  // ── Dashboards ──

  @Post('dashboards')
  createDashboard(@CurrentUser('userId') userId: string, @Body() dto: CreateDashboardDto) {
    return this.dashService.createDashboard(userId, dto);
  }

  @Get('dashboards')
  findDashboards(@CurrentUser('userId') userId: string) {
    return this.dashService.findDashboards(userId);
  }

  @Get('dashboards/:id')
  findDashboard(@Param('id', ParseUUIDPipe) id: string) {
    return this.dashService.findDashboardWithData(id);
  }

  // ── Widgets ──

  @Post('dashboards/:id/widgets')
  addWidget(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateWidgetDto) {
    return this.dashService.addWidget(id, dto);
  }

  @Patch('widgets/:id')
  updateWidget(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWidgetDto) {
    return this.dashService.updateWidget(id, dto);
  }

  @Delete('widgets/:id')
  removeWidget(@Param('id', ParseUUIDPipe) id: string) {
    return this.dashService.removeWidget(id);
  }

  @Get('widgets/:id/data')
  getWidgetData(@Param('id', ParseUUIDPipe) id: string) {
    return this.dashService.getWidgetData(id);
  }

  // ── AI Query ──

  @Post('query')
  askQuestion(@CurrentUser('userId') userId: string, @Body() dto: AskQuestionDto) {
    return this.queryService.askQuestion(userId, dto.question);
  }

  @Get('query/history')
  getQueryHistory(@CurrentUser('userId') userId: string) {
    return this.queryService.getHistory(userId);
  }

  // ── Stats ──

  @Get('stats/overview')
  getOverview() {
    return this.statsService.getOverview();
  }
}
