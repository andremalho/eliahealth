import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultation } from './consultation.entity.js';
import { FhrStatus, EdemaGrade, ConsultationAlert } from './consultation.enums.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { CreateConsultationDto } from './dto/create-consultation.dto.js';
import { UpdateConsultationDto } from './dto/update-consultation.dto.js';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private readonly repo: Repository<Consultation>,
    private readonly pregnanciesService: PregnanciesService,
  ) {}

  async create(pregnancyId: string, dto: CreateConsultationDto): Promise<Consultation> {
    const pregnancy = await this.pregnanciesService.findOne(pregnancyId);
    const ga = this.pregnanciesService.getGestationalAge(pregnancy, new Date(dto.date));

    const consultation = this.repo.create({
      ...dto,
      pregnancyId,
      gestationalAgeDays: ga.totalDays,
    });

    this.evaluateAlerts(consultation);
    return this.repo.save(consultation);
  }

  async findAllByPregnancy(pregnancyId: string, page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      where: { pregnancyId },
      order: { date: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Consultation> {
    const consultation = await this.repo.findOneBy({ id });
    if (!consultation) {
      throw new NotFoundException(`Consulta ${id} nao encontrada`);
    }
    return consultation;
  }

  async update(id: string, dto: UpdateConsultationDto): Promise<Consultation> {
    const consultation = await this.findOne(id);

    if (dto.date && dto.date !== consultation.date) {
      const pregnancy = await this.pregnanciesService.findOne(consultation.pregnancyId);
      const ga = this.pregnanciesService.getGestationalAge(pregnancy, new Date(dto.date));
      consultation.gestationalAgeDays = ga.totalDays;
    }

    Object.assign(consultation, dto);
    this.evaluateAlerts(consultation);
    return this.repo.save(consultation);
  }

  private evaluateAlerts(consultation: Consultation): void {
    const alerts: ConsultationAlert[] = [];

    // FHR alerts
    if (consultation.fhrStatus) {
      switch (consultation.fhrStatus) {
        case FhrStatus.TACHYCARDIA:
          alerts.push({ level: 'attention', message: 'Taquicardia fetal — avaliar causas' });
          break;
        case FhrStatus.BRADYCARDIA:
          alerts.push({ level: 'urgent', message: 'Bradicardia fetal — avaliacao imediata' });
          break;
        case FhrStatus.ABSENT:
          alerts.push({ level: 'critical', message: 'CRITICO: BCF ausente — emergencia obstetrica' });
          break;
        case FhrStatus.ARRHYTHMIA:
          alerts.push({ level: 'attention', message: 'Arritmia fetal detectada — ecocardiografia fetal recomendada' });
          break;
      }
    }

    // Biophysical profile alerts
    if (consultation.biophysicalProfile != null) {
      if (consultation.biophysicalProfile <= 4) {
        alerts.push({ level: 'critical', message: `PBF <= 4 — comprometimento fetal grave` });
      } else if (consultation.biophysicalProfile === 6) {
        alerts.push({ level: 'attention', message: 'PBF = 6 — resultado limítrofe, repetir em 24h' });
      }
    }

    // Edema alerts
    if (consultation.edemaGrade) {
      const severeEdema: string[] = [
        EdemaGrade.THREE_PLUS, EdemaGrade.FOUR_PLUS,
      ];
      if (severeEdema.includes(consultation.edemaGrade)) {
        alerts.push({ level: 'urgent', message: 'Edema importante — investigar pre-eclampsia' });
      }
    }

    consultation.alerts = alerts.length > 0 ? alerts : null;
  }
}
