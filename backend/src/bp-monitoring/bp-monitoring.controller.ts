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
import { BpMonitoringService } from './bp-monitoring.service.js';
import { CreateBpConfigDto } from './dto/create-bp-config.dto.js';
import { UpdateBpConfigDto } from './dto/update-bp-config.dto.js';
import { CreateBpReadingDto } from './dto/create-bp-reading.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('pregnancies/:pregnancyId')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class BpMonitoringController {
  constructor(private readonly service: BpMonitoringService) {}

  // ── Config ──

  @Post('bp-config')
  createConfig(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateBpConfigDto,
  ) {
    return this.service.createConfig(pregnancyId, dto);
  }

  @Get('bp-config')
  getConfig(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.getConfig(pregnancyId);
  }

  @Patch('bp-config')
  updateConfig(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: UpdateBpConfigDto,
  ) {
    return this.service.updateConfig(pregnancyId, dto);
  }

  // ── BP Readings ──
  // TODO: integração com esfigmomanômetros eletrônicos — adicionar endpoint POST /bp/device-sync

  @Post('bp')
  createReading(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateBpReadingDto,
  ) {
    return this.service.createReading(pregnancyId, dto);
  }

  @Get('bp')
  findReadings(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.findReadings(pregnancyId, dateFrom, dateTo);
  }

  @Get('bp/summary')
  getSummary(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.getSummary(pregnancyId);
  }

  @Get('bp/alerts')
  findAlerts(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.findAlerts(pregnancyId);
  }

  @Get('bp/timeline')
  getTimeline(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.getTimeline(pregnancyId);
  }

  @Get('bp/daily-table')
  getDailyTable(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.getDailyTable(pregnancyId);
  }
}
