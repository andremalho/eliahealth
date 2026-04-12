import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { TelemedicineService } from './telemedicine.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('telemedicine')
export class TelemedicineController {
  constructor(private readonly service: TelemedicineService) {}

  @Post('sessions')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  createSession(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { patientId: string; appointmentId?: string },
  ) {
    return this.service.createSession({
      patientId: body.patientId,
      doctorId: userId,
      appointmentId: body.appointmentId,
      tenantId,
    });
  }

  @Get('sessions/mine')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  getMySessions(@CurrentUser('userId') userId: string) {
    return this.service.findByDoctor(userId);
  }

  @Get('sessions/:id')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  getSession(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post('sessions/:id/start')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  startCall(@Param('id') id: string) {
    return this.service.startCall(id);
  }

  @Post('sessions/:id/end')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  endCall(@Param('id') id: string, @Body() body: { notes?: string }) {
    return this.service.endCall(id, body.notes);
  }

  // ── Patient access ──

  @Get('patient-session/:id')
  @Roles(UserRole.PATIENT)
  getPatientSession(
    @CurrentUser('patientId') patientId: string,
    @Param('id') id: string,
  ) {
    return this.service.getPatientSession(patientId, id);
  }

  @Get('patient-sessions')
  @Roles(UserRole.PATIENT)
  getPatientSessions(@CurrentUser('patientId') patientId: string) {
    return this.service.findByPatient(patientId);
  }
}
