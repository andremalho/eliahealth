import { Controller, Get, Post, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('pregnancies/:pregnancyId/notifications/invite-email')
  sendInviteEmail(@Param('pregnancyId', ParseUUIDPipe) id: string) {
    return this.service.sendInviteEmail(id);
  }

  @Post('pregnancies/:pregnancyId/notifications/invite-whatsapp')
  generateWhatsAppInvite(@Param('pregnancyId', ParseUUIDPipe) id: string) {
    return this.service.generateWhatsAppInvite(id);
  }

  @Get('pregnancies/:pregnancyId/notifications')
  findAll(@Param('pregnancyId', ParseUUIDPipe) id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.service.findAll(id, p, l);
  }
}
