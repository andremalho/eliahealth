import { Controller, Get, Post, Param, ParseUUIDPipe } from '@nestjs/common';
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
  findAll(@Param('pregnancyId', ParseUUIDPipe) id: string) {
    return this.service.findAll(id);
  }
}
