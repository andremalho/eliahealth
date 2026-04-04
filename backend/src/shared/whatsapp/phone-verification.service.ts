import { Injectable, BadRequestException } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service.js';

interface OTPEntry {
  code: string;
  expiresAt: number;
}

@Injectable()
export class PhoneVerificationService {
  // In-memory store; replace with Redis in production
  private readonly store = new Map<string, OTPEntry>();

  constructor(private readonly whatsApp: WhatsAppService) {}

  async generateOTP(phone: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    this.store.set(phone, { code, expiresAt });
    await this.whatsApp.sendOTP(phone, code);
  }

  verifyOTP(phone: string, code: string): boolean {
    const entry = this.store.get(phone);
    if (!entry) throw new BadRequestException('Codigo nao encontrado. Solicite um novo.');
    if (Date.now() > entry.expiresAt) {
      this.store.delete(phone);
      throw new BadRequestException('Codigo expirado. Solicite um novo.');
    }
    if (entry.code !== code) {
      throw new BadRequestException('Codigo incorreto');
    }
    this.store.delete(phone);
    return true;
  }
}
