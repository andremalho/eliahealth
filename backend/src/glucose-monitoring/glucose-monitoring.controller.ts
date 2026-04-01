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
  // TODO: integração com glicosímetros — adicionar endpoint POST /glucose/device-sync para receber leituras via Bluetooth/API

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
  getSummary(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.getSummary(pregnancyId);
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
  getDailyTable(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.getDailyTable(pregnancyId);
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
