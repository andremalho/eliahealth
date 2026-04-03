import { Controller, Get, Post, Param, ParseUUIDPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';

@Controller()
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
