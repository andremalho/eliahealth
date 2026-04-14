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
import { ResolveCheckItemDto } from './dto/resolve-check-item.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('copilot')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class ClinicalCopilotController {
  constructor(private readonly service: ClinicalCopilotService) {}

  // POST /copilot/post-consultation-check/:consultationId
  @Post('post-consultation-check/:consultationId')
  generateCheck(
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
    @CurrentUser('sub') doctorId: string,
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
    @CurrentUser('sub') doctorId: string,
  ) {
    return this.service.resolveCheckItem(itemId, doctorId, dto.resolution, dto.resolutionNote);
  }

  // PATCH /copilot/check/:checkId/reviewed
  @Patch('check/:checkId/reviewed')
  markReviewed(
    @Param('checkId', ParseUUIDPipe) checkId: string,
    @CurrentUser('sub') doctorId: string,
  ) {
    return this.service.markCheckAsReviewed(checkId, doctorId);
  }

  // GET /copilot/stats
  @Get('stats')
  getStats(
    @CurrentUser('sub') doctorId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getDoctorCheckStats(doctorId, tenantId, from, to);
  }
}
