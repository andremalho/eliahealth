import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorSchedule, DoctorBlockedDate } from './doctor-schedule.entity.js';
import { Appointment } from './appointment.entity.js';
import { AppointmentStatus } from './appointment.enums.js';

export interface TimeSlot {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  available: boolean;
}

@Injectable()
export class SlotGenerationService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly scheduleRepo: Repository<DoctorSchedule>,
    @InjectRepository(DoctorBlockedDate)
    private readonly blockedRepo: Repository<DoctorBlockedDate>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async getAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();

    // Check if date is blocked
    const blocked = await this.blockedRepo.findOneBy({ doctorId, blockedDate: date });
    if (blocked) return [];

    // Get schedule for this day
    const schedule = await this.scheduleRepo.findOne({
      where: { doctorId, dayOfWeek, isActive: true },
    });
    if (!schedule) return [];

    // Generate all possible slots
    const allSlots = this.generateSlots(schedule.startTime, schedule.endTime, schedule.slotDurationMin);

    // Get existing appointments for this day
    const existing = await this.appointmentRepo.createQueryBuilder('a')
      .where('a.doctorId = :doctorId', { doctorId })
      .andWhere('a.date = :date', { date })
      .andWhere('a.status NOT IN (:...excluded)', {
        excluded: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      })
      .getMany();

    // Mark occupied slots
    return allSlots.map((slot) => ({
      ...slot,
      available: !existing.some((a) =>
        a.startTime < slot.endTime && a.endTime > slot.startTime,
      ),
    }));
  }

  async getAvailableSlotsRange(doctorId: string, startDate: string, endDate: string): Promise<Record<string, TimeSlot[]>> {
    const result: Record<string, TimeSlot[]> = {};
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const slots = await this.getAvailableSlots(doctorId, dateStr);
      const available = slots.filter((s) => s.available);
      if (available.length > 0) result[dateStr] = available;
    }
    return result;
  }

  async findNextAvailableSlot(doctorId: string, afterDate: string, daysToSearch = 30): Promise<{ date: string; slot: TimeSlot } | null> {
    const start = new Date(afterDate + 'T12:00:00');
    for (let i = 0; i < daysToSearch; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const slots = await this.getAvailableSlots(doctorId, dateStr);
      const freeSlot = slots.find((s) => s.available);
      if (freeSlot) return { date: dateStr, slot: freeSlot };
    }
    return null;
  }

  // Schedule management
  async setSchedule(doctorId: string, schedules: {
    dayOfWeek: number; startTime: string; endTime: string; slotDurationMin?: number;
  }[]) {
    // Deactivate existing
    await this.scheduleRepo.update({ doctorId }, { isActive: false });
    // Create new
    const entities = schedules.map((s) => this.scheduleRepo.create({
      doctorId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDurationMin: s.slotDurationMin ?? 30,
      isActive: true,
    }));
    return this.scheduleRepo.save(entities);
  }

  async getSchedule(doctorId: string) {
    return this.scheduleRepo.find({
      where: { doctorId, isActive: true },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async blockDate(doctorId: string, date: string, reason?: string) {
    const entity = this.blockedRepo.create({ doctorId, blockedDate: date, reason: reason ?? null });
    return this.blockedRepo.save(entity);
  }

  async getBlockedDates(doctorId: string) {
    return this.blockedRepo.find({
      where: { doctorId },
      order: { blockedDate: 'ASC' },
    });
  }

  async unblockDate(id: string) {
    await this.blockedRepo.delete(id);
  }

  private generateSlots(startTime: string, endTime: string, durationMin: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let currentMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    while (currentMin + durationMin <= endMin) {
      const slotStart = `${String(Math.floor(currentMin / 60)).padStart(2, '0')}:${String(currentMin % 60).padStart(2, '0')}`;
      const slotEnd = `${String(Math.floor((currentMin + durationMin) / 60)).padStart(2, '0')}:${String((currentMin + durationMin) % 60).padStart(2, '0')}`;
      slots.push({ startTime: slotStart, endTime: slotEnd, available: true });
      currentMin += durationMin;
    }
    return slots;
  }
}
