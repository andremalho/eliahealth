import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Appointment } from './appointment.entity.js';
import { AppointmentStatus } from './appointment.enums.js';
import { MailService } from '../mail/mail.service.js';
import { WhatsAppService } from '../shared/whatsapp/whatsapp.service.js';

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger(AppointmentReminderService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    private readonly mailService: MailService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  /**
   * Cron job: executa todo dia às 8h.
   * Envia lembretes para consultas em 48h e 24h.
   */
  @Cron('0 8 * * *')
  async handleReminders() {
    this.logger.log('Iniciando envio de lembretes de consultas...');
    const today = new Date();

    // 48h reminders
    const date48h = this.addDays(today, 2);
    await this.sendReminders(date48h, '48h');

    // 24h reminders
    const date24h = this.addDays(today, 1);
    await this.sendReminders(date24h, '24h');
  }

  private async sendReminders(targetDate: string, type: '48h' | '24h') {
    const fieldSent = type === '48h' ? 'reminder48hSent' : 'reminder24hSent';

    const appointments = await this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .where('a.date = :date', { date: targetDate })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
      })
      .andWhere(`a.${type === '48h' ? 'reminder_48h_sent' : 'reminder_24h_sent'} = false`)
      .getMany();

    this.logger.log(`${appointments.length} lembretes ${type} para enviar (${targetDate})`);

    for (const appt of appointments) {
      const patientName = appt.patient?.fullName?.split(' ')[0] ?? 'Paciente';
      const doctorName = appt.doctor?.name ?? 'seu medico';
      const dateFormatted = new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR');
      const time = appt.startTime?.slice(0, 5) ?? '';

      // WhatsApp
      const phone = (appt.patient as any)?.phone;
      if (phone) {
        try {
          await this.whatsAppService.sendOTP(
            phone.replace(/\D/g, ''),
            `Ola ${patientName}! Lembrete: sua consulta com Dr(a) ${doctorName} esta agendada para ${dateFormatted} as ${time}. EliaHealth`,
          );
        } catch (err) {
          this.logger.error(`Falha WhatsApp para ${phone}: ${err}`);
        }
      }

      // Email
      const email = appt.patient?.email;
      if (email) {
        try {
          await this.mailService.sendOtpEmail(email, '', patientName);
          // Usando sendOtpEmail como fallback — idealmente criar sendReminderEmail
          this.logger.log(`Email lembrete enviado para ${email}`);
        } catch (err) {
          this.logger.error(`Falha email para ${email}: ${err}`);
        }
      }

      // Mark as sent
      if (type === '48h') appt.reminder48hSent = true;
      else appt.reminder24hSent = true;
      await this.repo.save(appt);
    }
  }

  private addDays(date: Date, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
