import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { HospitalizationService } from './hospitalization.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class HospitalizationController {
  constructor(private readonly service: HospitalizationService) {}

  @Post('hospitalizations')
  admit(@CurrentUser('userId') userId: string, @CurrentUser('tenantId') tenantId: string, @Body() dto: Record<string, unknown>) {
    return this.service.admit({ ...dto, attendingDoctorId: userId, tenantId } as any);
  }

  @Get('hospitalizations/active')
  findActive(@CurrentUser('tenantId') tenantId: string) { return this.service.findActive(tenantId); }

  @Get('hospitalizations/patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) { return this.service.findByPatient(patientId); }

  @Get('hospitalizations/:id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch('hospitalizations/:id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) { return this.service.update(id, dto as any); }

  @Post('hospitalizations/:id/discharge')
  discharge(@Param('id') id: string, @Body() dto: { dischargeSummary: string; dischargeDiagnosis?: string; dischargeInstructions?: string }) {
    return this.service.discharge(id, dto);
  }

  // ── Evolutions ──

  @Post('hospitalizations/:id/evolutions')
  addEvolution(@Param('id') id: string, @CurrentUser('userId') userId: string, @Body() dto: Record<string, unknown>) {
    return this.service.addEvolution(id, dto as any, userId);
  }

  @Get('hospitalizations/:id/evolutions')
  getEvolutions(@Param('id') id: string) { return this.service.getEvolutions(id); }

  @Patch('evolutions/:id')
  updateEvolution(@Param('id') id: string, @Body() dto: Record<string, unknown>) { return this.service.updateEvolution(id, dto as any); }

  @Delete('evolutions/:id')
  deleteEvolution(@Param('id') id: string) { return this.service.deleteEvolution(id); }
}
