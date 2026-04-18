import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ClinicalCopilotService } from './clinical-copilot.service.js';
import { LongitudinalIntelligenceService } from './services/longitudinal-intelligence.service.js';
import { ResolveCheckItemDto } from './dto/resolve-check-item.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('copilot')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class ClinicalCopilotController {
  constructor(
    private readonly service: ClinicalCopilotService,
    private readonly longitudinalService: LongitudinalIntelligenceService,
  ) {}

  // POST /copilot/post-consultation-check/:consultationId
  @Post('post-consultation-check/:consultationId')
  generateCheck(
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
    @CurrentUser('userId') doctorId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.generatePostConsultationCheck(consultationId, tenantId, doctorId);
  }

  // GET /copilot/check/:consultationId
  @Get('check/:consultationId')
  getCheck(
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getCheckByConsultation(consultationId, tenantId);
  }

  // PATCH /copilot/check-item/:itemId/resolve
  @Patch('check-item/:itemId/resolve')
  resolveItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ResolveCheckItemDto,
    @CurrentUser('userId') doctorId: string,
  ) {
    return this.service.resolveCheckItem(itemId, doctorId, dto.resolution, dto.resolutionNote);
  }

  // PATCH /copilot/check/:checkId/reviewed
  @Patch('check/:checkId/reviewed')
  markReviewed(
    @Param('checkId', ParseUUIDPipe) checkId: string,
    @CurrentUser('userId') doctorId: string,
  ) {
    return this.service.markCheckAsReviewed(checkId, doctorId);
  }

  // GET /copilot/stats
  @Get('stats')
  getStats(
    @CurrentUser('userId') doctorId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getDoctorCheckStats(doctorId, tenantId, from, to);
  }

  // ── Longitudinal Alerts ──

  // GET /copilot/longitudinal-alerts
  @Get('longitudinal-alerts')
  getLongitudinalAlerts(
    @CurrentUser('userId') doctorId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    return this.longitudinalService.getDoctorAlerts(
      doctorId,
      tenantId,
      unreadOnly === 'true',
      p,
      l,
    );
  }

  // PATCH /copilot/longitudinal-alerts/:id/read
  @Patch('longitudinal-alerts/:id/read')
  markAlertRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.longitudinalService.markAlertAsRead(id);
  }

  // PATCH /copilot/longitudinal-alerts/:id/respond
  @Patch('longitudinal-alerts/:id/respond')
  respondToAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('response') response: string,
  ) {
    return this.longitudinalService.respondToAlert(id, response);
  }
}
