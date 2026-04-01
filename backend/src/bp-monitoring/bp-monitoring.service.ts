import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BpMonitoringConfig } from './bp-config.entity.js';
import { BpReading } from './bp-reading.entity.js';
import { BpStatus, BP_ALARM_SYMPTOMS } from './bp-monitoring.enums.js';
import { CreateBpConfigDto } from './dto/create-bp-config.dto.js';
import { UpdateBpConfigDto } from './dto/update-bp-config.dto.js';
import { CreateBpReadingDto } from './dto/create-bp-reading.dto.js';

@Injectable()
export class BpMonitoringService {
  constructor(
    @InjectRepository(BpMonitoringConfig)
    private readonly configRepo: Repository<BpMonitoringConfig>,
    @InjectRepository(BpReading)
    private readonly readingRepo: Repository<BpReading>,
  ) {}

  // ── Config CRUD ──

  async createConfig(pregnancyId: string, dto: CreateBpConfigDto): Promise<BpMonitoringConfig> {
    const config = this.configRepo.create({ ...dto, pregnancyId, isActive: dto.isActive ?? true });
    return this.configRepo.save(config);
  }

  async getConfig(pregnancyId: string): Promise<BpMonitoringConfig> {
    const config = await this.configRepo.findOneBy({ pregnancyId });
    if (!config) throw new NotFoundException(`Configuracao de PA nao encontrada para gestacao ${pregnancyId}`);
    return config;
  }

  async updateConfig(pregnancyId: string, dto: UpdateBpConfigDto): Promise<BpMonitoringConfig> {
    const config = await this.getConfig(pregnancyId);
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }

  // ── BP Reading CRUD ──
  // TODO: integração com esfigmomanômetros eletrônicos — adicionar endpoint POST /bp/device-sync

  async createReading(pregnancyId: string, dto: CreateBpReadingDto): Promise<BpReading> {
    const config = await this.getConfigOrDefaults(pregnancyId);
    const reading = this.readingRepo.create({ ...dto, pregnancyId });
    this.evaluateAlert(reading, config);
    return this.readingRepo.save(reading);
  }

  async findReadings(pregnancyId: string, dateFrom?: string, dateTo?: string): Promise<BpReading[]> {
    const where: Record<string, unknown> = { pregnancyId };
    if (dateFrom && dateTo) {
      where.readingDate = Between(dateFrom, dateTo);
    }
    return this.readingRepo.find({ where, order: { readingDate: 'DESC', readingTime: 'DESC' } });
  }

  async findAlerts(pregnancyId: string): Promise<BpReading[]> {
    return this.readingRepo.find({
      where: { pregnancyId, alertTriggered: true },
      order: { readingDate: 'DESC', readingTime: 'DESC' },
    });
  }

  // ── Analytics ──

  async getSummary(pregnancyId: string) {
    const readings = await this.readingRepo.find({ where: { pregnancyId }, order: { readingDate: 'ASC', readingTime: 'ASC' } });

    if (readings.length === 0) {
      return { totalReadings: 0, avgSystolic: 0, avgDiastolic: 0, withinTargetPercent: 0, trend: 'insufficient_data' };
    }

    const config = await this.getConfigOrDefaults(pregnancyId);
    let sumSys = 0, sumDia = 0, inTarget = 0;

    for (const r of readings) {
      sumSys += r.systolic;
      sumDia += r.diastolic;
      if (r.systolic <= config.targetSystolicMax && r.diastolic <= config.targetDiastolicMax) {
        inTarget++;
      }
    }

    // Tendência: comparar média das últimas 5 com as 5 anteriores
    let trend: 'rising' | 'stable' | 'falling' | 'insufficient_data' = 'insufficient_data';
    if (readings.length >= 6) {
      const recent = readings.slice(-5);
      const prior = readings.slice(-10, -5);
      if (prior.length >= 3) {
        const recentAvg = recent.reduce((s, r) => s + r.systolic, 0) / recent.length;
        const priorAvg = prior.reduce((s, r) => s + r.systolic, 0) / prior.length;
        const diff = recentAvg - priorAvg;
        if (diff > 5) trend = 'rising';
        else if (diff < -5) trend = 'falling';
        else trend = 'stable';
      }
    }

    return {
      totalReadings: readings.length,
      avgSystolic: Math.round(sumSys / readings.length),
      avgDiastolic: Math.round(sumDia / readings.length),
      withinTargetPercent: Math.round((inTarget / readings.length) * 100),
      trend,
    };
  }

  async getTimeline(pregnancyId: string) {
    const readings = await this.readingRepo.find({
      where: { pregnancyId },
      order: { readingDate: 'ASC', readingTime: 'ASC' },
    });

    const grouped: Record<string, BpReading[]> = {};
    for (const r of readings) {
      if (!grouped[r.readingDate]) grouped[r.readingDate] = [];
      grouped[r.readingDate].push(r);
    }
    return grouped;
  }

  async getDailyTable(pregnancyId: string) {
    const readings = await this.readingRepo.find({
      where: { pregnancyId },
      order: { readingDate: 'ASC', readingTime: 'ASC' },
    });

    const days: Record<string, BpReading[]> = {};
    for (const r of readings) {
      if (!days[r.readingDate]) days[r.readingDate] = [];
      days[r.readingDate].push(r);
    }

    return Object.entries(days).map(([date, measures]) => ({ date, measures }));
  }

  // ── Privados ──

  private evaluateAlert(
    reading: BpReading,
    config: { targetSystolicMax: number; targetDiastolicMax: number; criticalSystolic: number; criticalDiastolic: number },
  ): void {
    const s = reading.systolic;
    const d = reading.diastolic;
    const messages: string[] = [];

    // Hipotensão
    if (s < 90) {
      reading.status = BpStatus.ATTENTION;
      reading.alertTriggered = true;
      reading.alertMessage = `PA baixa: ${s}/${d}mmHg — avaliar hipotensão`;
      return;
    }

    // Hipertensão grave (crítico)
    if (s >= config.criticalSystolic || d >= config.criticalDiastolic) {
      reading.status = BpStatus.CRITICAL;
      reading.alertTriggered = true;
      messages.push(`CRÍTICO: Hipertensão grave ${s}/${d}mmHg — risco de eclâmpsia, avaliação imediata`);

      // Sinais de alarme
      const symptoms = reading.symptoms ?? [];
      const hasAlarmSymptom = symptoms.some((sym) =>
        (BP_ALARM_SYMPTOMS as readonly string[]).includes(sym),
      );
      if (hasAlarmSymptom) {
        messages.push('SINAIS DE ALARME PRESENTES — considerar hospitalização urgente');
      }

      reading.alertMessage = messages.join('. ');
      return;
    }

    // Hipertensão leve (atenção)
    if (s >= config.targetSystolicMax || d >= config.targetDiastolicMax) {
      reading.status = BpStatus.ATTENTION;
      reading.alertTriggered = true;
      reading.alertMessage = `PA elevada: ${s}/${d}mmHg — monitorar de perto`;
      return;
    }

    reading.status = BpStatus.NORMAL;
    reading.alertTriggered = false;
    reading.alertMessage = null;
  }

  private async getConfigOrDefaults(pregnancyId: string) {
    const config = await this.configRepo.findOneBy({ pregnancyId });
    return config ?? { targetSystolicMax: 140, targetDiastolicMax: 90, criticalSystolic: 160, criticalDiastolic: 110 };
  }
}
