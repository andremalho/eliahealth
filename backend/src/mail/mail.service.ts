import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get<number>('SMTP_PORT', 587) === 465,
        auth: {
          user: this.config.get<string>('SMTP_USER', ''),
          pass: this.config.get<string>('SMTP_PASS', ''),
        },
      });
      this.logger.log(`SMTP configurado: ${host}`);
    } else {
      this.logger.warn('SMTP_HOST nao configurado — emails serao apenas logados');
    }
  }

  async sendOtpEmail(to: string, code: string, patientName?: string): Promise<boolean> {
    const subject = `${code} — Seu codigo de acesso EliaHealth`;
    const html = this.buildOtpHtml(code, patientName);

    return this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(`[MAIL SIMULADO] Para: ${to} | Assunto: ${subject}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM', 'EliaHealth <noreply@eliahealth.com>'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email enviado para ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar email para ${to}`, (err as Error).stack);
      return false;
    }
  }

  private buildOtpHtml(code: string, patientName?: string): string {
    const greeting = patientName ? `Ola, ${patientName.split(' ')[0]}!` : 'Ola!';
    return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f3ff">
  <div style="max-width:420px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <div style="background:#1e1b4b;padding:24px 32px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">eliahealth</h1>
      <p style="margin:4px 0 0;color:#c4b5fd;font-size:12px">Portal da Gestante</p>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;color:#374151;font-size:15px">${greeting}</p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px">Use o codigo abaixo para acessar seu portal. Ele e valido por <strong>10 minutos</strong>.</p>
      <div style="background:#f5f3ff;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1e1b4b;font-family:monospace">${code}</span>
      </div>
      <p style="margin:0;color:#9ca3af;font-size:12px">Se voce nao solicitou este codigo, ignore este email.</p>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:11px">eliahealth — seus dados estao protegidos</p>
    </div>
  </div>
</body></html>`;
  }
}
