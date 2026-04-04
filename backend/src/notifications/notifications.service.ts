import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification, NotificationType, NotificationTemplate, NotificationStatus,
} from './notification.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { PatientVerificationService } from '../patient-verification/patient-verification.service.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Pregnancy)
    private readonly pregnancyRepo: Repository<Pregnancy>,
    private readonly verificationService: PatientVerificationService,
  ) {}

  async sendInviteEmail(pregnancyId: string) {
    const pregnancy = await this.pregnancyRepo.findOneBy({ id: pregnancyId });
    if (!pregnancy) throw new NotFoundException('Gestacao nao encontrada');

    const patient = await this.patientRepo.findOneBy({ id: pregnancy.patientId });
    if (!patient) throw new NotFoundException('Paciente nao encontrada');

    // Trigger verification email
    const verification = await this.verificationService.sendVerificationEmail(patient.id);

    const notification = this.repo.create({
      pregnancyId,
      patientId: patient.id,
      type: NotificationType.EMAIL,
      template: NotificationTemplate.PORTAL_INVITE,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
      content: `Convite de acesso ao portal enviado para ${patient.email}`,
      metadata: { verificationId: verification.id },
    });
    await this.repo.save(notification);

    return { sent: true, email: patient.email, notificationId: notification.id };
  }

  async generateWhatsAppInvite(pregnancyId: string) {
    const pregnancy = await this.pregnancyRepo.findOneBy({ id: pregnancyId });
    if (!pregnancy) throw new NotFoundException('Gestacao nao encontrada');

    const patient = await this.patientRepo.findOneBy({ id: pregnancy.patientId });
    if (!patient) throw new NotFoundException('Paciente nao encontrada');

    const phone = patient.phone?.replace(/\D/g, '') ?? '';
    const message = encodeURIComponent(
      `Ola ${patient.fullName}! Seu prontuario digital esta pronto na EliaHealth. ` +
      `Acesse o portal da paciente para acompanhar sua gestacao, ver exames e muito mais. ` +
      `Fale com seu medico para receber o link de acesso por email.`,
    );

    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

    const notification = this.repo.create({
      pregnancyId,
      patientId: patient.id,
      type: NotificationType.WHATSAPP,
      template: NotificationTemplate.PORTAL_INVITE,
      status: NotificationStatus.PENDING,
      content: decodeURIComponent(message),
      metadata: { whatsappUrl, phone },
    });
    await this.repo.save(notification);

    return { whatsappUrl, notificationId: notification.id };
  }

  async findAll(pregnancyId: string, page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      where: { pregnancyId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
