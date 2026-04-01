import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { GlucoseMonitoringConfig } from './glucose-config.entity.js';
import { GlucoseReading } from './glucose-reading.entity.js';
import { InsulinDose } from './insulin-dose.entity.js';
import {
  GlucoseStatus,
  MeasurementType,
  POST_MEAL_1H_TYPES,
  POST_MEAL_2H_TYPES,
} from './glucose-monitoring.enums.js';
import { CreateGlucoseConfigDto } from './dto/create-glucose-config.dto.js';
import { UpdateGlucoseConfigDto } from './dto/update-glucose-config.dto.js';
import { CreateGlucoseReadingDto } from './dto/create-glucose-reading.dto.js';
import { CreateInsulinDoseDto } from './dto/create-insulin-dose.dto.js';

@Injectable()
export class GlucoseMonitoringService {
  constructor(
    @InjectRepository(GlucoseMonitoringConfig)
    private readonly configRepo: Repository<GlucoseMonitoringConfig>,
    @InjectRepository(GlucoseReading)
    private readonly readingRepo: Repository<GlucoseReading>,
    @InjectRepository(InsulinDose)
    private readonly insulinRepo: Repository<InsulinDose>,
  ) {}

  // ── Config CRUD ──

  async createConfig(pregnancyId: string, dto: CreateGlucoseConfigDto): Promise<GlucoseMonitoringConfig> {
    const config = this.configRepo.create({ ...dto, pregnancyId, isActive: dto.isActive ?? true });
    return this.configRepo.save(config);
  }

  async getConfig(pregnancyId: string): Promise<GlucoseMonitoringConfig> {
    const config = await this.configRepo.findOneBy({ pregnancyId });
    if (!config) throw new NotFoundException(`Configuracao de glicemia nao encontrada para gestacao ${pregnancyId}`);
    return config;
  }

  async updateConfig(pregnancyId: string, dto: UpdateGlucoseConfigDto): Promise<GlucoseMonitoringConfig> {
    const config = await this.getConfig(pregnancyId);
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }

  // ── Glucose Reading CRUD ──

  async createReading(pregnancyId: string, dto: CreateGlucoseReadingDto): Promise<GlucoseReading> {
    const config = await this.getConfigOrDefaults(pregnancyId);
    const reading = this.readingRepo.create({ ...dto, pregnancyId });
    this.evaluateAlert(reading, config);
    return this.readingRepo.save(reading);
  }

  async findReadings(pregnancyId: string, dateFrom?: string, dateTo?: string): Promise<GlucoseReading[]> {
    const where: Record<string, unknown> = { pregnancyId };
    if (dateFrom && dateTo) {
      where.readingDate = Between(dateFrom, dateTo);
    }
    return this.readingRepo.find({ where, order: { readingDate: 'DESC', readingTime: 'DESC' } });
  }

  async findAlerts(pregnancyId: string): Promise<GlucoseReading[]> {
    return this.readingRepo.find({
      where: { pregnancyId, alertTriggered: true },
      order: { readingDate: 'DESC', readingTime: 'DESC' },
    });
  }

  // ── Insulin Dose CRUD ──

  async createInsulinDose(pregnancyId: string, dto: CreateInsulinDoseDto): Promise<InsulinDose> {
    const dose = this.insulinRepo.create({ ...dto, pregnancyId });
    return this.insulinRepo.save(dose);
  }

  async findInsulinDoses(pregnancyId: string): Promise<InsulinDose[]> {
    return this.insulinRepo.find({
      where: { pregnancyId },
      order: { administrationDate: 'DESC', administrationTime: 'DESC' },
    });
  }

  // ── Analytics ──

  async getSummary(pregnancyId: string) {
    const readings = await this.readingRepo.find({ where: { pregnancyId } });
    const config = await this.getConfigOrDefaults(pregnancyId);

    if (readings.length === 0) {
      return { totalReadings: 0, averageByType: {}, withinTarget: 0, aboveTarget: 0, belowTarget: 0 };
    }

    const byType: Record<string, { sum: number; count: number; inTarget: number }> = {};

    let inTarget = 0;
    let above = 0;
    let below = 0;

    for (const r of readings) {
      const type = r.measurementType;
      if (!byType[type]) byType[type] = { sum: 0, count: 0, inTarget: 0 };
      byType[type].sum += r.glucoseValue;
      byType[type].count += 1;

      const target = this.getTargetForType(type, config);
      if (r.glucoseValue < 60) { below++; }
      else if (r.glucoseValue <= target) { inTarget++; byType[type].inTarget++; }
      else { above++; }
    }

    const averageByType: Record<string, { average: number; count: number; percentInTarget: number }> = {};
    for (const [type, data] of Object.entries(byType)) {
      averageByType[type] = {
        average: Math.round(data.sum / data.count),
        count: data.count,
        percentInTarget: Math.round((data.inTarget / data.count) * 100),
      };
    }

    return {
      totalReadings: readings.length,
      averageByType,
      withinTargetPercent: Math.round((inTarget / readings.length) * 100),
      aboveTargetPercent: Math.round((above / readings.length) * 100),
      belowTargetPercent: Math.round((below / readings.length) * 100),
    };
  }

  async getTimeline(pregnancyId: string) {
    const readings = await this.readingRepo.find({
      where: { pregnancyId },
      order: { readingDate: 'ASC', readingTime: 'ASC' },
    });

    const grouped: Record<string, GlucoseReading[]> = {};
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
    const insulinDoses = await this.insulinRepo.find({
      where: { pregnancyId },
      order: { administrationDate: 'ASC', administrationTime: 'ASC' },
    });

    const days: Record<string, { glucose: GlucoseReading[]; insulin: InsulinDose[] }> = {};

    for (const r of readings) {
      if (!days[r.readingDate]) days[r.readingDate] = { glucose: [], insulin: [] };
      days[r.readingDate].glucose.push(r);
    }
    for (const d of insulinDoses) {
      if (!days[d.administrationDate]) days[d.administrationDate] = { glucose: [], insulin: [] };
      days[d.administrationDate].insulin.push(d);
    }

    return Object.entries(days).map(([date, data]) => ({ date, ...data }));
  }

  // ── Privados ──

  private evaluateAlert(
    reading: GlucoseReading,
    config: { targetFasting: number; target1hPostMeal: number; target2hPostMeal: number; criticalThreshold: number },
  ): void {
    const v = reading.glucoseValue;

    // Hipoglicemia grave
    if (v < 60) {
      reading.status = GlucoseStatus.CRITICAL;
      reading.alertTriggered = true;
      reading.alertMessage = `CRÍTICO: Hipoglicemia grave ${v}mg/dL — tratamento imediato`;
      return;
    }

    // Hipoglicemia leve
    if (v < 70) {
      reading.status = GlucoseStatus.ATTENTION;
      reading.alertTriggered = true;
      reading.alertMessage = `Hipoglicemia leve ${v}mg/dL — ingerir carboidrato`;
      return;
    }

    // Hiperglicemia crítica
    if (v > config.criticalThreshold) {
      reading.status = GlucoseStatus.CRITICAL;
      reading.alertTriggered = true;
      reading.alertMessage = `CRÍTICO: Hiperglicemia grave ${v}mg/dL — avalie cetoacidose`;
      return;
    }

    // Jejum
    if (reading.measurementType === MeasurementType.FASTING && v > config.targetFasting) {
      reading.status = GlucoseStatus.ATTENTION;
      reading.alertTriggered = true;
      reading.alertMessage = `Glicemia de jejum elevada: ${v}mg/dL (meta: <${config.targetFasting}mg/dL)`;
      return;
    }

    // 1h pós-refeição
    if (POST_MEAL_1H_TYPES.includes(reading.measurementType) && v > config.target1hPostMeal) {
      reading.status = GlucoseStatus.ATTENTION;
      reading.alertTriggered = true;
      reading.alertMessage = `Glicemia 1h pós-refeição elevada: ${v}mg/dL (meta: <${config.target1hPostMeal}mg/dL)`;
      return;
    }

    // 2h pós-refeição
    if (POST_MEAL_2H_TYPES.includes(reading.measurementType) && v > config.target2hPostMeal) {
      reading.status = GlucoseStatus.ATTENTION;
      reading.alertTriggered = true;
      reading.alertMessage = `Glicemia 2h pós-refeição elevada: ${v}mg/dL (meta: <${config.target2hPostMeal}mg/dL)`;
      return;
    }

    reading.status = GlucoseStatus.NORMAL;
    reading.alertTriggered = false;
    reading.alertMessage = null;
  }

  private getTargetForType(
    type: MeasurementType,
    config: { targetFasting: number; target1hPostMeal: number; target2hPostMeal: number },
  ): number {
    if (type === MeasurementType.FASTING) return config.targetFasting;
    if (POST_MEAL_1H_TYPES.includes(type)) return config.target1hPostMeal;
    if (POST_MEAL_2H_TYPES.includes(type)) return config.target2hPostMeal;
    return config.target1hPostMeal; // default para bedtime/random
  }

  private async getConfigOrDefaults(pregnancyId: string) {
    const config = await this.configRepo.findOneBy({ pregnancyId });
    return config ?? { targetFasting: 95, target1hPostMeal: 140, target2hPostMeal: 120, criticalThreshold: 200 };
  }
}
