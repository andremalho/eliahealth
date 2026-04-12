import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  // ── Doctor endpoints ──

  @Post('send')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  doctorSend(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { patientId: string; content: string; attachmentUrl?: string },
  ) {
    return this.service.sendMessage({
      patientId: body.patientId,
      doctorId: userId,
      senderType: 'doctor',
      content: body.content,
      attachmentUrl: body.attachmentUrl,
      tenantId,
    });
  }

  @Get('conversations')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  doctorConversations(@CurrentUser('userId') userId: string) {
    return this.service.getDoctorConversations(userId);
  }

  @Get('messages/:patientId')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  getMessages(
    @CurrentUser('userId') userId: string,
    @Param('patientId') patientId: string,
    @Query('page') page?: string,
  ) {
    return this.service.getConversation(patientId, userId, parseInt(page ?? '1'));
  }

  @Post('read/:patientId')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  markRead(@CurrentUser('userId') userId: string, @Param('patientId') patientId: string) {
    return this.service.markRead(patientId, userId, 'doctor');
  }

  @Get('unread')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  unreadCount(@CurrentUser('userId') userId: string) {
    return this.service.getUnreadCount(userId, 'doctor');
  }

  // ── Patient endpoints (via portal) ──

  @Post('patient/send')
  @Roles(UserRole.PATIENT)
  patientSend(
    @CurrentUser('patientId') patientId: string,
    @Body() body: { doctorId: string; content: string; attachmentUrl?: string },
  ) {
    return this.service.sendMessage({
      patientId,
      doctorId: body.doctorId,
      senderType: 'patient',
      content: body.content,
      attachmentUrl: body.attachmentUrl,
    });
  }

  @Get('patient/conversations')
  @Roles(UserRole.PATIENT)
  patientConversations(@CurrentUser('patientId') patientId: string) {
    return this.service.getPatientConversations(patientId);
  }

  @Get('patient/messages/:doctorId')
  @Roles(UserRole.PATIENT)
  patientMessages(
    @CurrentUser('patientId') patientId: string,
    @Param('doctorId') doctorId: string,
    @Query('page') page?: string,
  ) {
    return this.service.getConversation(patientId, doctorId, parseInt(page ?? '1'));
  }

  @Post('patient/read/:doctorId')
  @Roles(UserRole.PATIENT)
  patientMarkRead(@CurrentUser('patientId') patientId: string, @Param('doctorId') doctorId: string) {
    return this.service.markRead(patientId, doctorId, 'patient');
  }
}
