import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { GlucoseMonitoringConfig } from './glucose-config.entity.js';
import { GlucoseReading } from './glucose-reading.entity.js';
import { InsulinDose } from './insulin-dose.entity.js';
import {
  GlucoseStatus,
  MeasurementType,
  ReadingSource,
  POST_MEAL_1H_TYPES,
  POST_MEAL_2H_TYPES,
} from './glucose-monitoring.enums.js';
import { CreateGlucoseConfigDto } from './dto/create-glucose-config.dto.js';
import { UpdateGlucoseConfigDto } from './dto/update-glucose-config.dto.js';
import { CreateGlucoseReadingDto } from './dto/create-glucose-reading.dto.js';
import { CreateInsulinDoseDto } from './dto/create-insulin-dose.dto.js';
import { DeviceSyncDto } from './dto/device-sync.dto.js';
import { DeviceConfigDto } from './dto/device-config.dto.js';

/** Column keys used in the daily table */
const TABLE_COLUMNS: MeasurementType[] = [
  MeasurementType.FASTING,
  MeasurementType.POST_BREAKFAST_1H,
  MeasurementType.POST_BREAKFAST_2H,
  MeasurementType.POST_LUNCH_1H,
  MeasurementType.POST_LUNCH_2H,
  MeasurementType.POST_DINNER_1H,
  MeasurementType.POST_DINNER_2H,
  MeasurementType.BEDTIME,
];

const CSV_HEADERS: Record<string, string> = {
  [MeasurementType.FASTING]: 'Jejum',
  [MeasurementType.POST_BREAKFAST_1H]: 'Pos cafe 1h',
  [MeasurementType.POST_BREAKFAST_2H]: 'Pos cafe 2h',
  [MeasurementType.POST_LUNCH_1H]: 'Pos almoco 1h',
  [MeasurementType.POST_LUNCH_2H]: 'Pos almoco 2h',
  [MeasurementType.POST_DINNER_1H]: 'Pos jantar 1h',
  [MeasurementType.POST_DINNER_2H]: 'Pos jantar 2h',
  [MeasurementType.BEDTIME]: 'Antes de dormir',
};

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

    // Compute combined readingDateTime
    reading.readingDateTime = new Date(`${dto.readingDate}T${dto.readingTime}:00`);

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

  // ── Device Integration ──

  async deviceSync(pregnancyId: string, dto: DeviceSyncDto) {
    const config = await this.getConfigOrDefaults(pregnancyId);
    let synced = 0;
    let duplicates = 0;
    let alerts = 0;

    for (const item of dto.readings) {
      // Deduplicate by deviceReadingId
      const existing = await this.readingRepo.findOneBy({
        deviceReadingId: item.deviceReadingId,
      });
      if (existing) {
        duplicates++;
        continue;
      }

      const dt = new Date(item.readingDateTime);
      const readingDate = dt.toISOString().split('T')[0];
      const readingTime = dt.toTimeString().substring(0, 5);

      const reading = this.readingRepo.create({
        pregnancyId,
        readingDate,
        readingTime,
        readingDateTime: dt,
        glucoseValue: item.glucoseValue,
        measurementType: item.measurementType ?? MeasurementType.RANDOM,
        source: ReadingSource.DEVICE_SYNC,
        deviceReadingId: item.deviceReadingId,
        rawDeviceData: item.rawDeviceData ?? null,
      });

      this.evaluateAlert(reading, config);
      if (reading.alertTriggered) alerts++;

      await this.readingRepo.save(reading);
      synced++;
    }

    // Update last sync timestamp on config
    const cfgEntity = await this.configRepo.findOneBy({ pregnancyId });
    if (cfgEntity) {
      cfgEntity.lastSyncAt = new Date();
      await this.configRepo.save(cfgEntity);
    }

    return { synced, duplicates, alerts };
  }

  async configureDevice(pregnancyId: string, dto: DeviceConfigDto) {
    let config = await this.configRepo.findOneBy({ pregnancyId });
    if (!config) {
      throw new NotFoundException(`Configuracao de glicemia nao encontrada para gestacao ${pregnancyId}`);
    }

    config.deviceIntegrationEnabled = true;
    if (dto.deviceBrand != null) config.deviceBrand = dto.deviceBrand;
    if (dto.deviceModel != null) config.deviceModel = dto.deviceModel;
    if (dto.deviceSerialNumber != null) config.deviceSerialNumber = dto.deviceSerialNumber;
    if (dto.integrationProtocol != null) config.integrationProtocol = dto.integrationProtocol;
    if (dto.integrationApiKey != null) config.integrationApiKey = dto.integrationApiKey;
    if (dto.autoSyncEnabled != null) config.autoSyncEnabled = dto.autoSyncEnabled;

    config = await this.configRepo.save(config);

    const instructions = this.getConnectionInstructions(config.integrationProtocol);

    return { config, instructions };
  }

  private getConnectionInstructions(protocol: string | null): string {
    switch (protocol) {
      case 'bluetooth':
        return 'Ative o Bluetooth no glicosimetro e no celular. ' +
          'Na tela de sincronizacao, selecione o aparelho na lista de dispositivos disponiveis. ' +
          'Compativel com: Accu-Chek Guide, OneTouch Verio Reflect, Contour Next One.';
      case 'api':
        return 'Insira sua chave de API do fabricante (Dexcom, LibreView). ' +
          'As leituras serao sincronizadas automaticamente a cada 15 minutos.';
      case 'usb':
        return 'Conecte o glicosimetro ao computador via cabo USB. ' +
          'Use o software do fabricante para exportar as leituras e importe no sistema.';
      case 'nfc':
        return 'Aproxime o celular do sensor NFC do glicosimetro (ex: FreeStyle Libre). ' +
          'A leitura sera transmitida automaticamente.';
      default:
        return 'Selecione o protocolo de integracao para ver as instrucoes.';
    }
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

  async getSummary(pregnancyId: string, startDate?: string, endDate?: string) {
    const where: Record<string, unknown> = { pregnancyId };
    if (startDate && endDate) {
      where.readingDate = Between(startDate, endDate);
    }

    const readings = await this.readingRepo.find({ where });
    const config = await this.getConfigOrDefaults(pregnancyId);

    if (readings.length === 0) {
      return {
        totalReadings: 0,
        alteredPercentage: 0,
        alteredCount: 0,
        normalCount: 0,
        criticalCount: 0,
        averageByType: {},
        dateRange: { start: startDate ?? null, end: endDate ?? null },
      };
    }

    const byType: Record<string, { sum: number; count: number }> = {};
    let normalCount = 0;
    let alteredCount = 0;
    let criticalCount = 0;

    for (const r of readings) {
      const type = r.measurementType;
      if (!byType[type]) byType[type] = { sum: 0, count: 0 };
      byType[type].sum += r.glucoseValue;
      byType[type].count += 1;

      if (r.status === GlucoseStatus.NORMAL) normalCount++;
      else if (r.status === GlucoseStatus.CRITICAL) criticalCount++;
      else alteredCount++;
    }

    const averageByType: Record<string, number> = {};
    for (const [type, data] of Object.entries(byType)) {
      averageByType[type] = Math.round(data.sum / data.count);
    }

    const total = readings.length;

    return {
      totalReadings: total,
      alteredPercentage: Math.round(((alteredCount + criticalCount) / total) * 100),
      alteredCount,
      normalCount,
      criticalCount,
      averageByType,
      dateRange: {
        start: startDate ?? readings.reduce((min, r) => r.readingDate < min ? r.readingDate : min, readings[0].readingDate),
        end: endDate ?? readings.reduce((max, r) => r.readingDate > max ? r.readingDate : max, readings[0].readingDate),
      },
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

  async getDailyTable(pregnancyId: string, startDate?: string, endDate?: string) {
    const where: Record<string, unknown> = { pregnancyId };
    if (startDate && endDate) {
      where.readingDate = Between(startDate, endDate);
    }

    const readings = await this.readingRepo.find({
      where,
      order: { readingDate: 'ASC', readingTime: 'ASC' },
    });

    const insulinWhere: Record<string, unknown> = { pregnancyId };
    if (startDate && endDate) {
      insulinWhere.administrationDate = Between(startDate, endDate);
    }
    const insulinDoses = await this.insulinRepo.find({
      where: insulinWhere,
      order: { administrationDate: 'ASC', administrationTime: 'ASC' },
    });

    // Group by date
    const days = new Map<string, {
      readings: Map<string, { value: number; status: string }>;
      insulin: { time: string; type: string; units: number }[];
    }>();

    for (const r of readings) {
      if (!days.has(r.readingDate)) {
        days.set(r.readingDate, { readings: new Map(), insulin: [] });
      }
      const day = days.get(r.readingDate)!;
      // Keep latest reading per measurement type
      day.readings.set(r.measurementType, {
        value: r.glucoseValue,
        status: r.status,
      });
    }

    for (const d of insulinDoses) {
      if (!days.has(d.administrationDate)) {
        days.set(d.administrationDate, { readings: new Map(), insulin: [] });
      }
      days.get(d.administrationDate)!.insulin.push({
        time: d.administrationTime,
        type: d.insulinType,
        units: Number(d.doseUnits),
      });
    }

    return Array.from(days.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        const row: Record<string, unknown> = { date };
        for (const col of TABLE_COLUMNS) {
          row[col] = data.readings.get(col) ?? null;
        }
        row.insulinDoses = data.insulin;
        return row;
      });
  }

  async exportCsv(pregnancyId: string, includeInsulin: boolean) {
    const table = await this.getDailyTable(pregnancyId);

    const headers = ['Data', ...TABLE_COLUMNS.map((c) => CSV_HEADERS[c])];
    if (includeInsulin) {
      headers.push('Insulina');
    }

    const rows = table.map((row) => {
      const cells: string[] = [row.date as string];
      for (const col of TABLE_COLUMNS) {
        const cell = row[col] as { value: number; status: string } | null;
        cells.push(cell ? `${cell.value}` : '');
      }
      if (includeInsulin) {
        const doses = row.insulinDoses as { time: string; type: string; units: number }[];
        cells.push(
          doses.map((d) => `${d.type} ${d.units}UI ${d.time}`).join('; '),
        );
      }
      return cells.join(',');
    });

    const csvData = [headers.join(','), ...rows].join('\n');
    const today = new Date().toISOString().split('T')[0];

    return {
      csvData,
      filename: `glicemia_${pregnancyId.substring(0, 8)}_${today}.csv`,
    };
  }

  // ── Privados ──

  private evaluateAlert(
    reading: GlucoseReading,
    config: { targetFasting: number; target1hPostMeal: number; target2hPostMeal: number; criticalThreshold: number },
  ): void {
    const v = reading.glucoseValue;

    if (v < 60) {
      reading.status = GlucoseStatus.CRITICAL;
      reading.alertTriggered = true;
      reading.alertMessage = `CRITICO: Hipoglicemia grave ${v}mg/dL — tratamento imediato`;
      return;
    }

    if (v < 70) {
      reading.status = GlucoseStatus.ATTENTION;
      reading.alertTriggered = true;
      reading.alertMessage = `Hipoglicemia leve ${v}mg/dL — ingerir carboidrato`;
      return;
    }

    if (v > config.criticalThreshold) {
      reading.status = GlucoseStatus.CRITICAL;
      reading.alertTriggered = true;
      reading.alertMessage = `CRITICO: Hiperglicemia grave ${v}mg/dL — avalie cetoacidose`;
      return;
    }

    if (reading.measurementType === MeasurementType.FASTING && v > config.targetFasting) {
      reading.status = GlucoseStatus.ATTENTION;
      reading.alertTriggered = true;
      reading.alertMessage = `Glicemia de jejum elevada: ${v}mg/dL (meta: <${config.targetFasting}mg/dL)`;
      return;
    }

    if (POST_MEAL_1H_TYPES.includes(reading.measurementType) && v > config.target1hPostMeal) {
      reading.status = GlucoseStatus.ATTENTION;
      reading.alertTriggered = true;
      reading.alertMessage = `Glicemia 1h pos-refeicao elevada: ${v}mg/dL (meta: <${config.target1hPostMeal}mg/dL)`;
      return;
    }

    if (POST_MEAL_2H_TYPES.includes(reading.measurementType) && v > config.target2hPostMeal) {
      reading.status = GlucoseStatus.ATTENTION;
      reading.alertTriggered = true;
      reading.alertMessage = `Glicemia 2h pos-refeicao elevada: ${v}mg/dL (meta: <${config.target2hPostMeal}mg/dL)`;
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
    return config.target1hPostMeal;
  }

  private async getConfigOrDefaults(pregnancyId: string) {
    const config = await this.configRepo.findOneBy({ pregnancyId });
    return config ?? { targetFasting: 95, target1hPostMeal: 140, target2hPostMeal: 120, criticalThreshold: 200 };
  }
}
