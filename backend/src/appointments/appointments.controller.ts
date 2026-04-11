import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { SlotGenerationService } from './slot-generation.service.js';
import { AutoScheduleService } from './auto-schedule.service.js';
import { AppointmentAlertService } from './appointment-alert.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('appointments')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.RECEPTIONIST)
export class AppointmentsController {
  constructor(
    private readonly service: AppointmentsService,
    private readonly slotService: SlotGenerationService,
    private readonly autoScheduleService: AutoScheduleService,
    private readonly alertService: AppointmentAlertService,
  ) {}

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

  // ── Doctor Schedule & Slots ──

  @Post('schedules')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  setSchedule(
    @CurrentUser('userId') userId: string,
    @Body() body: { schedules: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMin?: number }[] },
  ) {
    return this.slotService.setSchedule(userId, body.schedules);
  }

  @Get('schedules/:doctorId')
  getSchedule(@Param('doctorId') doctorId: string) {
    return this.slotService.getSchedule(doctorId);
  }

  @Post('blocked-dates')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  blockDate(
    @CurrentUser('userId') userId: string,
    @Body() body: { date: string; reason?: string },
  ) {
    return this.slotService.blockDate(userId, body.date, body.reason);
  }

  @Get('blocked-dates/:doctorId')
  getBlockedDates(@Param('doctorId') doctorId: string) {
    return this.slotService.getBlockedDates(doctorId);
  }

  @Delete('blocked-dates/:id')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  unblockDate(@Param('id') id: string) {
    return this.slotService.unblockDate(id);
  }

  @Get('available-slots')
  getAvailableSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.slotService.getAvailableSlots(doctorId, date);
  }

  @Get('available-slots-range')
  getAvailableSlotsRange(
    @Query('doctorId') doctorId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.slotService.getAvailableSlotsRange(doctorId, startDate, endDate);
  }

  // ── Auto-Schedule ──

  @Post('auto-schedule/:pregnancyId')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  autoSchedule(
    @Param('pregnancyId') pregnancyId: string,
    @CurrentUser('userId') doctorId: string,
  ) {
    return this.autoScheduleService.generatePrenatalSchedule(pregnancyId, doctorId);
  }

  @Get('auto-schedule/:pregnancyId')
  getAutoScheduled(@Param('pregnancyId') pregnancyId: string) {
    return this.autoScheduleService.getAutoScheduled(pregnancyId);
  }

  // ── Appointment Alerts ──

  @Post('alerts')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  createAlert(
    @CurrentUser('userId') userId: string,
    @Body() body: {
      patientId: string;
      pregnancyId?: string;
      appointmentType: string;
      gaWindowMin?: number;
      gaWindowMax?: number;
      message?: string;
    },
  ) {
    return this.alertService.create({ ...body, requestedBy: userId });
  }

  @Get('alerts/mine')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  getMyAlerts(@CurrentUser('userId') userId: string) {
    return this.alertService.getDoctorAlerts(userId);
  }

  // ── Check-in ──

  @Public()
  @Post('checkin/:token')
  async checkin(@Param('token') token: string) {
    const appointment = await this.service.checkin(token);
    return { checkedIn: true, appointmentId: appointment.id };
  }

  // ── Procedures Calendar ──

  @Get('procedures')
  getProcedures(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.service.getProceduresCalendar(
      parseInt(month ?? String(new Date().getMonth() + 1)),
      parseInt(year ?? String(new Date().getFullYear())),
      doctorId,
    );
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
