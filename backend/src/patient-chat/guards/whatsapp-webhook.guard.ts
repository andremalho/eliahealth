import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class WhatsAppWebhookGuard implements CanActivate {
  private readonly logger = new Logger(WhatsAppWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // GET requests for verification don't need signature check
    if (request.method === 'GET') return true;

    const signature = request.headers['x-hub-signature-256'];
    const appSecret = this.configService.get<string>('WHATSAPP_APP_SECRET');

    // In dev mode, skip signature validation
    if (!appSecret) {
      this.logger.warn('WHATSAPP_APP_SECRET not set — skipping webhook signature validation');
      return true;
    }

    if (!signature) {
      this.logger.warn('Webhook request without signature');
      return false;
    }

    try {
      const body = JSON.stringify(request.body);
      const expectedSignature = 'sha256=' + createHmac('sha256', appSecret).update(body).digest('hex');
      return signature === expectedSignature;
    } catch (err) {
      this.logger.error(`Webhook signature validation failed: ${(err as Error).message}`);
      return false;
    }
  }
}
