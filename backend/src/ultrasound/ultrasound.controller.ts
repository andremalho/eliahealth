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
import { UltrasoundService } from './ultrasound.service.js';
import { CreateUltrasoundDto } from './dto/create-ultrasound.dto.js';
import { UpdateUltrasoundDto } from './dto/update-ultrasound.dto.js';
import { CreateBiometryDto } from './dto/create-biometry.dto.js';
import { UpdateBiometryDto } from './dto/update-biometry.dto.js';
import { CreateDopplerDto } from './dto/create-doppler.dto.js';
import { UpdateDopplerDto } from './dto/update-doppler.dto.js';
import { CreateBiophysicalDto } from './dto/create-biophysical.dto.js';
import { UpdateBiophysicalDto } from './dto/update-biophysical.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class UltrasoundController {
  constructor(private readonly ultrasoundService: UltrasoundService) {}

  @Post('pregnancies/:pregnancyId/ultrasounds')
  create(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateUltrasoundDto,
  ) {
    return this.ultrasoundService.create(pregnancyId, dto);
  }

  @Get('pregnancies/:pregnancyId/ultrasounds')
  findAll(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.ultrasoundService.findAllByPregnancy(pregnancyId, p, l);
  }

  @Get('ultrasounds/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.ultrasoundService.findOne(id, tenantId);
  }

  @Patch('ultrasounds/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateUltrasoundDto,
  ) {
    return this.ultrasoundService.update(id, dto, tenantId);
  }

  @Post('ultrasounds/:id/biometry')
  addBiometry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBiometryDto,
  ) {
    return this.ultrasoundService.addBiometry(id, dto);
  }

  @Post('ultrasounds/:id/doppler')
  addDoppler(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDopplerDto,
  ) {
    return this.ultrasoundService.addDoppler(id, dto);
  }

  @Post('ultrasounds/:id/biophysical')
  addBiophysical(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBiophysicalDto,
  ) {
    return this.ultrasoundService.addBiophysical(id, dto);
  }

  @Patch('ultrasounds/:id/biometry')
  updateBiometry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBiometryDto,
  ) {
    return this.ultrasoundService.updateBiometry(id, dto);
  }

  @Patch('ultrasounds/:id/doppler')
  updateDoppler(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDopplerDto,
  ) {
    return this.ultrasoundService.updateDoppler(id, dto);
  }

  @Patch('ultrasounds/:id/biophysical')
  updateBiophysical(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBiophysicalDto,
  ) {
    return this.ultrasoundService.updateBiophysical(id, dto);
  }

  @Post('ultrasounds/:id/generate-report')
  generateReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.ultrasoundService.generateReport(id);
  }
}
