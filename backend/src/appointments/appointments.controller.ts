import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('appointments')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.RECEPTIONIST)
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.create(dto, userId, tenantId);
  }

  @Get()
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    if (date) return this.service.findByDate(date, tenantId, doctorId);
    if (startDate && endDate) return this.service.findByDateRange(startDate, endDate, tenantId, doctorId);
    // Default: today
    return this.service.findByDate(new Date().toISOString().split('T')[0], tenantId, doctorId);
  }

  @Get('summary')
  summary(
    @CurrentUser('tenantId') tenantId: string,
    @Query('date') date?: string,
  ) {
    return this.service.summary(date ?? new Date().toISOString().split('T')[0], tenantId);
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.service.findByPatient(patientId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.cancel(id, body?.reason);
  }

  // ── Secretary Assignments ──

  @Post('assign-secretary')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  assignSecretary(
    @Body() body: { secretaryId: string; doctorId: string },
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.assignSecretary(body.secretaryId, body.doctorId, userId);
  }

  @Delete('assign-secretary/:id')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  removeAssignment(@Param('id') id: string) {
    return this.service.removeAssignment(id);
  }

  @Get('my-doctors')
  @Roles(UserRole.RECEPTIONIST)
  getMyDoctors(@CurrentUser('userId') userId: string) {
    return this.service.getAssignedDoctors(userId);
  }

  @Get('my-secretaries')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  getMySecretaries(@CurrentUser('userId') userId: string) {
    return this.service.getAssignedSecretaries(userId);
  }
}
