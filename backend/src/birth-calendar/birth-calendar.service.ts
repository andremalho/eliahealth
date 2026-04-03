import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { PregnancyStatus } from '../pregnancies/pregnancy.enums.js';

@Injectable()
export class BirthCalendarService {
  constructor(
    @InjectRepository(Pregnancy) private readonly repo: Repository<Pregnancy>,
    private readonly pregnanciesService: PregnanciesService,
  ) {}

  async getByMonth(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const pregnancies = await this.repo.find({
      where: { status: PregnancyStatus.ACTIVE, edd: Between(startDate, endDate) },
      relations: ['patient'],
      order: { edd: 'ASC' },
    });

    const today = new Date();
    return pregnancies.map((p) => {
      const ga = this.pregnanciesService.getGestationalAge(p);
      const eddDate = new Date(p.edd);
      const daysUntil = Math.ceil((eddDate.getTime() - today.getTime()) / 86_400_000);
      const weekOfMonth = Math.ceil(new Date(p.edd).getDate() / 7);

      return {
        pregnancyId: p.id,
        patientName: p.patient?.fullName ?? 'N/A',
        edd: p.edd,
        gaWeeks: ga.weeks,
        gaDays: ga.days,
        daysUntilEdd: daysUntil,
        weekOfMonth,
      };
    });
  }

  async getUpcoming(days: number) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 86_400_000);
    const startDate = today.toISOString().split('T')[0];
    const endDate = futureDate.toISOString().split('T')[0];

    const pregnancies = await this.repo.find({
      where: { status: PregnancyStatus.ACTIVE, edd: Between(startDate, endDate) },
      relations: ['patient'],
      order: { edd: 'ASC' },
    });

    return pregnancies.map((p) => {
      const ga = this.pregnanciesService.getGestationalAge(p);
      const eddDate = new Date(p.edd);
      const daysUntil = Math.ceil((eddDate.getTime() - today.getTime()) / 86_400_000);

      return {
        pregnancyId: p.id,
        patientName: p.patient?.fullName ?? 'N/A',
        edd: p.edd,
        gaWeeks: ga.weeks,
        gaDays: ga.days,
        daysUntilEdd: daysUntil,
      };
    });
  }
}
