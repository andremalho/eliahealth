import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator.js';
import { WhatsAppWebhookGuard } from './guards/whatsapp-webhook.guard.js';
import { PatientChatService } from './patient-chat.service.js';

@Controller('webhook/whatsapp')
export class PatientChatController {
  constructor(
    private readonly chatService: PatientChatService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post()
  @UseGuards(WhatsAppWebhookGuard)
  async handleWebhook(@Body() body: any): Promise<{ status: string }> {
    const message = this.extractMessage(body);
    if (message) {
      // Processar em background para responder rapido ao webhook
      this.chatService
        .processIncomingMessage(message.from, message.text, message.id)
        .catch((err) => console.error('Webhook processing error:', err));
    }
    return { status: 'ok' };
  }

  @Public()
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    throw new ForbiddenException('Invalid verify token');
  }

  private extractMessage(body: any): { from: string; text: string; id: string } | null {
    try {
      const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!msg || msg.type !== 'text') return null;
      return {
        from: msg.from,
        text: msg.text.body,
        id: msg.id,
      };
    } catch {
      return null;
    }
  }
}
