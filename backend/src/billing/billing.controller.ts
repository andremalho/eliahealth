import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { BillingService } from './billing.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('billing')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Post()
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: Record<string, unknown>) {
    return this.service.create({ ...dto, tenantId } as any);
  }

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string, @Query('status') status?: string, @Query('page') page?: string) {
    return this.service.findAll(tenantId, status, parseInt(page ?? '1'));
  }

  @Get('summary')
  getSummary(@CurrentUser('tenantId') tenantId: string) { return this.service.getSummary(tenantId); }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) { return this.service.findByPatient(patientId); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) { return this.service.update(id, dto as any); }

  @Post(':id/submit')
  submit(@Param('id') id: string) { return this.service.submit(id); }

  @Post(':id/paid')
  markPaid(@Param('id') id: string, @Body() body: { paidValue: number }) { return this.service.markPaid(id, body.paidValue); }

  @Post(':id/deny')
  deny(@Param('id') id: string, @Body() body: { reason: string }) { return this.service.deny(id, body.reason); }
}
