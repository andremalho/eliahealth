import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { UltrasoundReportsService } from './ultrasound-reports.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('ultrasound-reports')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class UltrasoundReportsController {
  constructor(private readonly service: UltrasoundReportsService) {}

  @Post()
  create(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: {
      patientId: string;
      pregnancyId?: string;
      templateId: string;
      category: string;
      reportDate: string;
      data: Record<string, unknown>;
      conclusion?: string;
    },
  ) {
    return this.service.create({ ...dto, doctorId: userId, tenantId });
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.service.findByPatient(patientId);
  }

  @Get('pregnancy/:pregnancyId')
  findByPregnancy(@Param('pregnancyId') pregnancyId: string) {
    return this.service.findByPregnancy(pregnancyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.service.update(id, dto);
  }

  @Post(':id/sign')
  sign(
    @Param('id') id: string,
    @Body() body: { doctorName: string; doctorCrm: string },
  ) {
    return this.service.sign(id, body.doctorName, body.doctorCrm);
  }

  @Post(':id/export')
  markExported(@Param('id') id: string, @Body() body: { format: string }) {
    return this.service.markExported(id, body.format);
  }

  @Post(':id/send')
  markSent(@Param('id') id: string, @Body() body: { via: string; to: string }) {
    return this.service.markSent(id, body.via, body.to);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
