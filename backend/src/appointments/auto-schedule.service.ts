import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity.js';
import { AppointmentStatus, AppointmentType } from './appointment.enums.js';
import { SlotGenerationService } from './slot-generation.service.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

/**
 * Protocolo pré-natal padrão (ACOG/MS):
 *   Até 28 semanas: a cada 4 semanas
 *   28-36 semanas: a cada 2 semanas
 *   36-40 semanas: semanal
 */
const PRENATAL_SCHEDULE_WEEKS = [
  8, 12, 16, 20, 24, 28,    // a cada 4 semanas
  30, 32, 34, 36,            // a cada 2 semanas
  37, 38, 39, 40,            // semanal
];

@Injectable()
export class AutoScheduleService {
  private readonly logger = new Logger(AutoScheduleService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Pregnancy)
    private readonly pregnancyRepo: Repository<Pregnancy>,
    private readonly slotService: SlotGenerationService,
  ) {}

  /**
   * Gera agenda pré-natal completa para uma gestação.
   * Busca o slot mais próximo da data ideal para cada consulta.
   */
  async generatePrenatalSchedule(pregnancyId: string, doctorId: string): Promise<Appointment[]> {
    const pregnancy = await this.pregnancyRepo.findOneBy({ id: pregnancyId });
    if (!pregnancy) throw new NotFoundException('Gestacao nao encontrada');
    if (!pregnancy.lmpDate) throw new NotFoundException('DUM nao definida');

    const lmp = new Date(pregnancy.lmpDate);
    const created: Appointment[] = [];

    for (const week of PRENATAL_SCHEDULE_WEEKS) {
      const idealDate = new Date(lmp);
      idealDate.setDate(idealDate.getDate() + week * 7);
      const idealStr = idealDate.toISOString().split('T')[0];

      // Skip past dates
      if (idealDate < new Date()) continue;

      // Check if already has appointment near this date (±7 days)
      const nearby = await this.appointmentRepo.createQueryBuilder('a')
        .where('a.pregnancyId = :pregnancyId', { pregnancyId })
        .andWhere('a.date BETWEEN :start AND :end', {
          start: this.addDays(idealStr, -7),
          end: this.addDays(idealStr, 7),
        })
        .andWhere('a.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
        .getCount();
      if (nearby > 0) continue;

      // Find next available slot
      const next = await this.slotService.findNextAvailableSlot(doctorId, idealStr, 14);
      if (!next) {
        this.logger.warn(`Sem slot disponivel para semana ${week} da gestacao ${pregnancyId}`);
        continue;
      }

      const appointment = this.appointmentRepo.create({
        patientId: pregnancy.patientId,
        doctorId,
        pregnancyId,
        date: next.date,
        startTime: next.slot.startTime,
        endTime: next.slot.endTime,
        type: week === PRENATAL_SCHEDULE_WEEKS[0] ? AppointmentType.CONSULTATION : AppointmentType.FOLLOW_UP,
        status: AppointmentStatus.SCHEDULED,
        autoScheduled: true,
        notes: `Consulta pre-natal — ${week} semanas (auto-agendada)`,
      });
      const saved = await this.appointmentRepo.save(appointment);
      created.push(saved);
    }

    this.logger.log(`${created.length} consultas auto-agendadas para gestacao ${pregnancyId}`);
    return created;
  }

  async getAutoScheduled(pregnancyId: string) {
    return this.appointmentRepo.find({
      where: { pregnancyId, autoScheduled: true },
      relations: ['doctor'],
      order: { date: 'ASC' },
    });
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
