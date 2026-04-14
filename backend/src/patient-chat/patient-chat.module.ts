import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './entities/chat-session.entity.js';
import { ChatMessage } from './entities/chat-message.entity.js';
import { PatientChatService } from './patient-chat.service.js';
import { PatientChatController } from './patient-chat.controller.js';
import { WhatsAppWebhookGuard } from './guards/whatsapp-webhook.guard.js';
import { Patient } from '../patients/patient.entity.js';
import { WhatsAppModule } from '../shared/whatsapp/whatsapp.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage, Patient]),
    WhatsAppModule,
  ],
  controllers: [PatientChatController],
  providers: [PatientChatService, WhatsAppWebhookGuard],
  exports: [PatientChatService],
})
export class PatientChatModule {}
