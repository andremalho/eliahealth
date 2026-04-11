import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity.js';
import { SecretaryAssignment } from './secretary-assignment.entity.js';
import { AppointmentStatus } from './appointment.enums.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    @InjectRepository(SecretaryAssignment)
    private readonly assignmentRepo: Repository<SecretaryAssignment>,
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

  // ── Check-in ──

  async checkin(token: string): Promise<Appointment> {
    const appointment = await this.repo.findOneBy({ checkinToken: token });
    if (!appointment) throw new NotFoundException('Token de check-in invalido');
    if (appointment.isCheckedIn) throw new ConflictException('Check-in ja realizado');
    appointment.isCheckedIn = true;
    appointment.checkedInAt = new Date();
    appointment.status = AppointmentStatus.ARRIVED;
    return this.repo.save(appointment);
  }

  // ── Procedures Calendar ──

  async getProceduresCalendar(month: number, year: number, doctorId?: string) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    const doctorFilter = doctorId ? `AND doctor_id = '${doctorId}'` : '';

    const queries = [
      // IVF procedures
      `SELECT 'egg_retrieval' AS type, 'Coleta de ovulos' AS label,
              oocyte_retrieval_date AS date, p.full_name AS patient_name, iv.patient_id, u.name AS doctor_name
       FROM ivf_cycles iv
       JOIN patients p ON p.id = iv.patient_id
       LEFT JOIN users u ON u.id = iv.doctor_id
       WHERE oocyte_retrieval_date BETWEEN '${startDate}' AND '${endDate}' ${doctorFilter}`,

      `SELECT 'embryo_transfer' AS type, 'Transferencia' AS label,
              transfer_date AS date, p.full_name AS patient_name, iv.patient_id, u.name AS doctor_name
       FROM ivf_cycles iv
       JOIN patients p ON p.id = iv.patient_id
       LEFT JOIN users u ON u.id = iv.doctor_id
       WHERE transfer_date BETWEEN '${startDate}' AND '${endDate}' ${doctorFilter}`,

      `SELECT 'trigger' AS type, 'Trigger (FIV)' AS label,
              trigger_date AS date, p.full_name AS patient_name, iv.patient_id, u.name AS doctor_name
       FROM ivf_cycles iv
       JOIN patients p ON p.id = iv.patient_id
       LEFT JOIN users u ON u.id = iv.doctor_id
       WHERE trigger_date BETWEEN '${startDate}' AND '${endDate}' ${doctorFilter}`,

      `SELECT 'beta_hcg' AS type, 'Beta HCG (FIV)' AS label,
              beta_hcg_date AS date, p.full_name AS patient_name, iv.patient_id, u.name AS doctor_name
       FROM ivf_cycles iv
       JOIN patients p ON p.id = iv.patient_id
       LEFT JOIN users u ON u.id = iv.doctor_id
       WHERE beta_hcg_date BETWEEN '${startDate}' AND '${endDate}' ${doctorFilter}`,

      `SELECT 'stimulation_start' AS type, 'Inicio estimulacao' AS label,
              stimulation_start_date AS date, p.full_name AS patient_name, iv.patient_id, u.name AS doctor_name
       FROM ivf_cycles iv
       JOIN patients p ON p.id = iv.patient_id
       LEFT JOIN users u ON u.id = iv.doctor_id
       WHERE stimulation_start_date BETWEEN '${startDate}' AND '${endDate}' ${doctorFilter}`,

      // IUI
      `SELECT 'iui' AS type, 'IIU' AS label,
              iui_date AS date, p.full_name AS patient_name, ic.patient_id, u.name AS doctor_name
       FROM iui_cycles ic
       JOIN patients p ON p.id = ic.patient_id
       LEFT JOIN users u ON u.id = ic.doctor_id
       WHERE iui_date BETWEEN '${startDate}' AND '${endDate}' ${doctorFilter}`,

      // OI
      `SELECT 'trigger' AS type, 'Trigger (IO)' AS label,
              trigger_date AS date, p.full_name AS patient_name, oi.patient_id, u.name AS doctor_name
       FROM ovulation_induction_cycles oi
       JOIN patients p ON p.id = oi.patient_id
       LEFT JOIN users u ON u.id = oi.doctor_id
       WHERE trigger_date BETWEEN '${startDate}' AND '${endDate}' ${doctorFilter}`,
    ];

    const results = await Promise.all(
      queries.map((q) => this.repo.query(q).catch(() => [])),
    );

    const all = results.flat().filter((r: any) => r.date);
    return all.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // ── Secretary Assignments ──

  async assignSecretary(secretaryId: string, doctorId: string, assignedBy: string) {
    const existing = await this.assignmentRepo.findOneBy({ secretaryId, doctorId });
    if (existing) {
      if (existing.isActive) throw new ConflictException('Secretaria ja vinculada a este medico');
      existing.isActive = true;
      existing.assignedBy = assignedBy;
      return this.assignmentRepo.save(existing);
    }
    const assignment = this.assignmentRepo.create({ secretaryId, doctorId, assignedBy });
    return this.assignmentRepo.save(assignment);
  }

  async removeAssignment(id: string) {
    const assignment = await this.assignmentRepo.findOneBy({ id });
    if (!assignment) throw new NotFoundException('Vinculo nao encontrado');
    assignment.isActive = false;
    return this.assignmentRepo.save(assignment);
  }

  async getAssignedDoctors(secretaryId: string) {
    const assignments = await this.assignmentRepo.find({
      where: { secretaryId, isActive: true },
      relations: ['doctor'],
    });
    return assignments.map((a) => ({
      id: a.id,
      doctorId: a.doctorId,
      doctorName: a.doctor?.name ?? null,
      doctorEmail: a.doctor?.email ?? null,
      specialty: (a.doctor as any)?.specialty ?? null,
    }));
  }

  async getAssignedSecretaries(doctorId: string) {
    const assignments = await this.assignmentRepo.find({
      where: { doctorId, isActive: true },
      relations: ['secretary'],
    });
    return assignments.map((a) => ({
      id: a.id,
      secretaryId: a.secretaryId,
      secretaryName: a.secretary?.name ?? null,
      secretaryEmail: a.secretary?.email ?? null,
    }));
  }

  async getDoctorIdsForSecretary(secretaryId: string): Promise<string[]> {
    const assignments = await this.assignmentRepo.find({
      where: { secretaryId, isActive: true },
      select: ['doctorId'],
    });
    return assignments.map((a) => a.doctorId);
  }

  private toResponse(a: Appointment) {
    return {
      id: a.id,
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
      type: a.type,
      status: a.status,
      category: a.category,
      notes: a.notes,
      cancellationReason: a.cancellationReason,
      patientId: a.patientId,
      patientName: a.patient?.fullName ?? null,
      doctorId: a.doctorId,
      doctorName: a.doctor?.name ?? null,
    };
  }
}
