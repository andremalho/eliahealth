import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GlucoseMonitoringService } from './glucose-monitoring.service.js';
import { CreateGlucoseConfigDto } from './dto/create-glucose-config.dto.js';
import { UpdateGlucoseConfigDto } from './dto/update-glucose-config.dto.js';
import { CreateGlucoseReadingDto } from './dto/create-glucose-reading.dto.js';
import { CreateInsulinDoseDto } from './dto/create-insulin-dose.dto.js';
import { DeviceSyncDto } from './dto/device-sync.dto.js';
import { DeviceConfigDto } from './dto/device-config.dto.js';

@Controller('pregnancies/:pregnancyId')
export class GlucoseMonitoringController {
  constructor(private readonly service: GlucoseMonitoringService) {}

  // ── Config ──

  @Post('glucose-config')
  createConfig(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateGlucoseConfigDto,
  ) {
    return this.service.createConfig(pregnancyId, dto);
  }

  @Get('glucose-config')
  getConfig(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.getConfig(pregnancyId);
  }

  @Patch('glucose-config')
  updateConfig(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: UpdateGlucoseConfigDto,
  ) {
    return this.service.updateConfig(pregnancyId, dto);
  }

  // ── Glucose Readings ──

  @Post('glucose')
  createReading(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateGlucoseReadingDto,
  ) {
    return this.service.createReading(pregnancyId, dto);
  }

  @Get('glucose')
  findReadings(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.findReadings(pregnancyId, dateFrom, dateTo);
  }

  @Get('glucose/summary')
  getSummary(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getSummary(pregnancyId, startDate, endDate);
  }

  @Get('glucose/alerts')
  findAlerts(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.findAlerts(pregnancyId);
  }

  @Get('glucose/timeline')
  getTimeline(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.getTimeline(pregnancyId);
  }

  @Get('glucose/daily-table')
  getDailyTable(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getDailyTable(pregnancyId, startDate, endDate);
  }

  @Get('glucose/export')
  exportCsv(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Query('includeInsulin') includeInsulin?: string,
  ) {
    return this.service.exportCsv(pregnancyId, includeInsulin === 'true');
  }

  // ── Device Integration ──

  @Post('glucose/device-sync')
  deviceSync(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: DeviceSyncDto,
  ) {
    return this.service.deviceSync(pregnancyId, dto);
  }

  @Post('glucose/config/device')
  configureDevice(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: DeviceConfigDto,
  ) {
    return this.service.configureDevice(pregnancyId, dto);
  }

  // ── Insulin Doses ──

  @Post('insulin')
  createInsulinDose(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateInsulinDoseDto,
  ) {
    return this.service.createInsulinDose(pregnancyId, dto);
  }

  @Get('insulin')
  findInsulinDoses(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.findInsulinDoses(pregnancyId);
  }
}
