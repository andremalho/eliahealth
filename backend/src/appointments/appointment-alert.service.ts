import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentAlert, AlertStatus } from './appointment-alert.entity.js';

@Injectable()
export class AppointmentAlertService {
  constructor(
    @InjectRepository(AppointmentAlert)
    private readonly repo: Repository<AppointmentAlert>,
  ) {}

  async create(dto: {
    patientId: string;
    pregnancyId?: string;
    requestedBy: string;
    appointmentType: string;
    gaWindowMin?: number;
    gaWindowMax?: number;
    message?: string;
  }): Promise<AppointmentAlert> {
    const alert = this.repo.create({
      ...dto,
      pregnancyId: dto.pregnancyId ?? null,
      gaWindowMin: dto.gaWindowMin ?? null,
      gaWindowMax: dto.gaWindowMax ?? null,
      message: dto.message ?? null,
      status: AlertStatus.PENDING,
    });
    return this.repo.save(alert);
  }

  async getPatientAlerts(patientId: string) {
    return this.repo.find({
      where: { patientId, status: AlertStatus.PENDING },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });
  }

  async markScheduled(alertId: string, appointmentId: string) {
    const alert = await this.repo.findOneBy({ id: alertId });
    if (!alert) throw new NotFoundException('Alerta nao encontrado');
    alert.status = AlertStatus.SCHEDULED;
    alert.scheduledAppointmentId = appointmentId;
    return this.repo.save(alert);
  }

  async getDoctorAlerts(doctorId: string) {
    return this.repo.find({
      where: { requestedBy: doctorId },
      relations: ['patient'],
      order: { createdAt: 'DESC' },
    });
  }
}
