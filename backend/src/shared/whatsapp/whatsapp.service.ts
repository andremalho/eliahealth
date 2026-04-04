import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.enabled = config.get('WHATSAPP_ENABLED', 'false') === 'true';
  }

  async sendOTP(phone: string, code: string): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[DEV] OTP para ${phone}: ${code}`);
      return;
    }

    // Meta WhatsApp Business API
    const url = `${this.config.get('WHATSAPP_API_URL')}/messages`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.get('WHATSAPP_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: this.config.get('WHATSAPP_OTP_TEMPLATE', 'otp_verification'),
          language: { code: 'pt_BR' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: code }] }],
        },
      }),
    });
  }

  async sendWelcome(phone: string, patientName: string, doctorName: string): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[DEV] Welcome para ${phone}: ${patientName} via ${doctorName}`);
      return;
    }

    const url = `${this.config.get('WHATSAPP_API_URL')}/messages`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.get('WHATSAPP_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: {
          body: `Ola ${patientName}! ${doctorName} preparou seu prontuario digital na EliaHealth. Acesse o portal da paciente para acompanhar sua gestacao.`,
        },
      }),
    });
  }
}
