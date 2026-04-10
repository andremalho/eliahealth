import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Appointment } from './appointment.entity.js';
import { AppointmentStatus } from './appointment.enums.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}

  async create(dto: CreateAppointmentDto, userId: string, tenantId?: string): Promise<Appointment> {
    await this.checkOverlap(dto.doctorId, dto.date, dto.startTime, dto.endTime);

    const appointment = this.repo.create({
      ...dto,
      createdById: userId,
      tenantId: tenantId ?? null,
    });
    return this.repo.save(appointment);
  }

  async findByDate(date: string, tenantId?: string, doctorId?: string) {
    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .where('a.date = :date', { date })
      .orderBy('a.startTime', 'ASC');

    if (tenantId) qb.andWhere('a.tenantId = :tenantId', { tenantId });
    if (doctorId) qb.andWhere('a.doctorId = :doctorId', { doctorId });

    const data = await qb.getMany();
    return data.map((a) => this.toResponse(a));
  }

  async findByDateRange(startDate: string, endDate: string, tenantId?: string, doctorId?: string) {
    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .where('a.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('a.date', 'ASC')
      .addOrderBy('a.startTime', 'ASC');

    if (tenantId) qb.andWhere('a.tenantId = :tenantId', { tenantId });
    if (doctorId) qb.andWhere('a.doctorId = :doctorId', { doctorId });

    const data = await qb.getMany();
    return data.map((a) => this.toResponse(a));
  }

  async findByPatient(patientId: string) {
    const data = await this.repo.find({
      where: { patientId },
      relations: ['doctor'],
      order: { date: 'DESC', startTime: 'DESC' },
    });
    return data.map((a) => ({
      id: a.id,
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
      type: a.type,
      status: a.status,
      notes: a.notes,
      doctorName: a.doctor?.name ?? null,
    }));
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.repo.findOneBy({ id });
    if (!appointment) throw new NotFoundException('Agendamento nao encontrado');

    // If rescheduling, check overlap
    if (dto.date || dto.startTime || dto.endTime) {
      const date = dto.date ?? appointment.date;
      const start = dto.startTime ?? appointment.startTime;
      const end = dto.endTime ?? appointment.endTime;
      const doctor = dto.doctorId ?? appointment.doctorId;
      await this.checkOverlap(doctor, date, start, end, id);
    }

    Object.assign(appointment, dto);
    return this.repo.save(appointment);
  }

  async cancel(id: string, reason?: string): Promise<Appointment> {
    const appointment = await this.repo.findOneBy({ id });
    if (!appointment) throw new NotFoundException('Agendamento nao encontrado');
    appointment.status = AppointmentStatus.CANCELLED;
    if (reason) appointment.cancellationReason = reason;
    return this.repo.save(appointment);
  }

  async summary(date: string, tenantId?: string) {
    const qb = this.repo.createQueryBuilder('a')
      .where('a.date = :date', { date });
    if (tenantId) qb.andWhere('a.tenantId = :tenantId', { tenantId });

    const all = await qb.getMany();
    return {
      total: all.length,
      scheduled: all.filter((a) => a.status === AppointmentStatus.SCHEDULED).length,
      confirmed: all.filter((a) => a.status === AppointmentStatus.CONFIRMED).length,
      arrived: all.filter((a) => a.status === AppointmentStatus.ARRIVED).length,
      inProgress: all.filter((a) => a.status === AppointmentStatus.IN_PROGRESS).length,
      completed: all.filter((a) => a.status === AppointmentStatus.COMPLETED).length,
      cancelled: all.filter((a) => a.status === AppointmentStatus.CANCELLED).length,
      noShow: all.filter((a) => a.status === AppointmentStatus.NO_SHOW).length,
    };
  }

  private async checkOverlap(doctorId: string, date: string, startTime: string, endTime: string, excludeId?: string) {
    const qb = this.repo.createQueryBuilder('a')
      .where('a.doctorId = :doctorId', { doctorId })
      .andWhere('a.date = :date', { date })
      .andWhere('a.startTime < :endTime', { endTime })
      .andWhere('a.endTime > :startTime', { startTime })
      .andWhere('a.status NOT IN (:...excludeStatus)', {
        excludeStatus: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      });

    if (excludeId) qb.andWhere('a.id != :excludeId', { excludeId });

    const overlap = await qb.getCount();
    if (overlap > 0) {
      throw new ConflictException('Horario ja ocupado para este medico');
    }
  }

  private toResponse(a: Appointment) {
    return {
      id: a.id,
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
      type: a.type,
      status: a.status,
      notes: a.notes,
      cancellationReason: a.cancellationReason,
      patientId: a.patientId,
      patientName: a.patient?.fullName ?? null,
      doctorId: a.doctorId,
      doctorName: a.doctor?.name ?? null,
    };
  }
}
