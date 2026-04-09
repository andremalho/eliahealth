import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostpartumConsultation, MoodScreening, LochiaType, LochiaAmount } from './postpartum-consultation.entity.js';
import { PregnancyOutcome } from '../pregnancy-outcome/pregnancy-outcome.entity.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { CreatePostpartumConsultationDto } from './dto/create-postpartum-consultation.dto.js';
import { UpdatePostpartumConsultationDto } from './dto/update-postpartum-consultation.dto.js';

@Injectable()
export class PostpartumService {
  constructor(
    @InjectRepository(PostpartumConsultation)
    private readonly repo: Repository<PostpartumConsultation>,
    @InjectRepository(PregnancyOutcome)
    private readonly outcomeRepo: Repository<PregnancyOutcome>,
    private readonly pregnanciesService: PregnanciesService,
  ) {}

  async create(pregnancyId: string, dto: CreatePostpartumConsultationDto): Promise<PostpartumConsultation> {
    const pregnancy = await this.pregnanciesService.findOne(pregnancyId);
    const deliveryDate = await this.getDeliveryDate(pregnancyId);
    const daysPostpartum = this.calculateDaysPostpartum(deliveryDate, pregnancy.edd, dto.date);

    const consultation = this.repo.create({
      ...dto,
      pregnancyId,
      daysPostpartum,
    });

    this.evaluateAlerts(consultation);
    return this.repo.save(consultation);
  }

  async findAllByPregnancy(pregnancyId: string) {
    const data = await this.repo.find({
      where: { pregnancyId },
      order: { date: 'ASC' },
    });
    return { data, total: data.length };
  }

  async findAllByPatient(patientId: string) {
    const data = await this.repo.query(
      `SELECT pc.*, p.edd, p.lmp_date, po.delivery_date, po.delivery_type,
              po.neonatal_data AS outcome_neonatal_data
       FROM postpartum_consultations pc
       JOIN pregnancies p ON p.id = pc.pregnancy_id
       LEFT JOIN pregnancy_outcomes po ON po.pregnancy_id = p.id
       WHERE p.patient_id = $1
       ORDER BY pc.date DESC`,
      [patientId],
    );
    return { data, total: data.length };
  }

  async findOne(id: string): Promise<PostpartumConsultation> {
    const consultation = await this.repo.findOneBy({ id });
    if (!consultation) throw new NotFoundException('Consulta puerperal nao encontrada');
    return consultation;
  }

  async update(id: string, dto: UpdatePostpartumConsultationDto): Promise<PostpartumConsultation> {
    const consultation = await this.findOne(id);

    if (dto.date && dto.date !== consultation.date) {
      const pregnancy = await this.pregnanciesService.findOne(consultation.pregnancyId);
      const deliveryDate = await this.getDeliveryDate(consultation.pregnancyId);
      consultation.daysPostpartum = this.calculateDaysPostpartum(deliveryDate, pregnancy.edd, dto.date);
    }

    Object.assign(consultation, dto);
    this.evaluateAlerts(consultation);
    return this.repo.save(consultation);
  }

  async remove(id: string): Promise<void> {
    const consultation = await this.findOne(id);
    await this.repo.remove(consultation);
  }

  private async getDeliveryDate(pregnancyId: string): Promise<string | null> {
    const outcome = await this.outcomeRepo.findOneBy({ pregnancyId });
    return outcome?.deliveryDate ?? null;
  }

  private calculateDaysPostpartum(deliveryDate: string | null, edd: string | null, consultationDate: string): number {
    const ref = deliveryDate ?? edd;
    if (!ref) return 0;
    const diff = Math.floor(
      (new Date(consultationDate).getTime() - new Date(ref).getTime()) / 86_400_000,
    );
    return Math.max(0, diff);
  }

  private evaluateAlerts(c: PostpartumConsultation): void {
    const alerts: { level: string; message: string }[] = [];

    // PA elevada no puerpério
    if (c.bpSystolic && c.bpDiastolic) {
      if (c.bpSystolic >= 160 || c.bpDiastolic >= 110) {
        alerts.push({ level: 'critical', message: 'PA severamente elevada — risco de eclampsia pos-parto' });
      } else if (c.bpSystolic >= 140 || c.bpDiastolic >= 90) {
        alerts.push({ level: 'urgent', message: 'Hipertensao pos-parto — monitorar de perto' });
      }
    }

    // Febre puerperal
    if (c.temperature && c.temperature >= 38) {
      alerts.push({ level: 'urgent', message: `Febre puerperal (${c.temperature}°C) — investigar infeccao` });
    }

    // Lóquios com odor fétido (sinal de endometrite)
    if (c.lochiaOdor === true) {
      alerts.push({ level: 'urgent', message: 'Loquios fetidos — investigar endometrite' });
    }

    // Lóquios rubra tardio (> 14 dias)
    if (c.lochiaType === LochiaType.RUBRA && c.daysPostpartum > 14) {
      alerts.push({ level: 'attention', message: 'Loquios rubra apos 14 dias — avaliar subinvolucao uterina' });
    }

    // Sangramento volumoso
    if (c.lochiaAmount === LochiaAmount.HEAVY) {
      alerts.push({ level: 'urgent', message: 'Sangramento puerperal abundante — avaliar hemorragia tardia' });
    }

    // Infecção de ferida
    if (c.woundStatus === 'infection') {
      alerts.push({ level: 'urgent', message: 'Infeccao de ferida operatoria — antibioticoterapia' });
    }

    // Screening de humor
    if (c.moodScreening === MoodScreening.SEVERE || (c.epdsScore != null && c.epdsScore >= 13)) {
      alerts.push({ level: 'critical', message: 'Risco elevado de depressao pos-parto — encaminhar para avaliacao psiquiatrica' });
    } else if (c.moodScreening === MoodScreening.MODERATE || (c.epdsScore != null && c.epdsScore >= 10)) {
      alerts.push({ level: 'attention', message: 'Sintomas de depressao pos-parto — acompanhamento proximo' });
    }

    // Mastite
    if (c.breastCondition === 'mastitis' || c.breastCondition === 'abscess') {
      alerts.push({ level: 'urgent', message: `${c.breastCondition === 'abscess' ? 'Abscesso mamario' : 'Mastite'} — avaliar antibioticoterapia` });
    }

    c.alerts = alerts.length > 0 ? alerts : null;
  }
}
