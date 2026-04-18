import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConsultationSummaryService } from './consultation-summary.service.js';
import { UpdateConsultationSummaryDto } from './dto/update-consultation-summary.dto.js';
import { SendConsultationSummaryDto } from './dto/send-consultation-summary.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('consultation-summaries')
export class ConsultationSummaryController {
  constructor(private readonly service: ConsultationSummaryService) {}

  // POST /consultation-summaries/generate/:consultationId
  // Dispara geracao manual (caso o automatico falhe)
  @Post('generate/:consultationId')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  generate(
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') doctorId: string,
  ) {
    return this.service.generateSummary(consultationId, tenantId, doctorId);
  }

  // GET /consultation-summaries/consultation/:consultationId
  // Lista resumos de uma consulta especifica (para o medico)
  @Get('consultation/:consultationId')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
  findByConsultation(
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findByConsultation(consultationId, tenantId);
  }

  // GET /consultation-summaries/patient/:patientId
  // Lista resumos de uma paciente (para portal)
  @Get('patient/:patientId')
  @Roles(UserRole.PATIENT, UserRole.PHYSICIAN, UserRole.ADMIN)
  getByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    return this.service.getPatientSummaries(patientId, tenantId, p, l);
  }

  // GET /consultation-summaries/:id
  @Get(':id')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.PATIENT)
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  // PATCH /consultation-summaries/:id/approve
  // Medico aprova (body opcional com texto editado)
  @Patch(':id/approve')
  @Roles(UserRole.PHYSICIAN)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') doctorId: string,
    @Body() dto: UpdateConsultationSummaryDto,
  ) {
    return this.service.approveSummary(id, doctorId, dto.summaryText, dto.deliveryChannel);
  }

  // POST /consultation-summaries/:id/send
  // Dispara envio apos aprovacao
  @Post(':id/send')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendConsultationSummaryDto,
  ) {
    return this.service.sendSummary(id);
  }

  // PATCH /consultation-summaries/:id/read
  // Paciente marca como lido
  @Patch(':id/read')
  @Roles(UserRole.PATIENT)
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('patientId') patientId: string,
  ) {
    return this.service.markAsRead(id, patientId);
  }
}
