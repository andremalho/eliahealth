import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ClinicalConsultationService } from './clinical-consultation.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class ClinicalConsultationController {
  constructor(private readonly service: ClinicalConsultationService) {}

  @Post('patients/:patientId/clinical-consultations')
  create(
    @Param('patientId') patientId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.service.create({ ...dto, patientId } as any, userId, tenantId);
  }

  @Get('patients/:patientId/clinical-consultations')
  findByPatient(
    @Param('patientId') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findByPatient(
      patientId,
      Math.max(1, parseInt(page ?? '1', 10) || 1),
      Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50)),
    );
  }

  @Get('clinical-consultations/:id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch('clinical-consultations/:id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.service.update(id, dto as any);
  }

  @Delete('clinical-consultations/:id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
