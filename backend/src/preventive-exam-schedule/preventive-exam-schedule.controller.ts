import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PreventiveExamScheduleService } from './preventive-exam-schedule.service.js';
import { CreatePreventiveExamScheduleDto } from './dto/create-preventive-exam-schedule.dto.js';
import { UpdatePreventiveExamScheduleDto } from './dto/update-preventive-exam-schedule.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('patients/:patientId/preventive-exam-schedules')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class PreventiveExamScheduleController {
  constructor(private readonly service: PreventiveExamScheduleService) {}

  @Post()
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreatePreventiveExamScheduleDto,
    @CurrentUser('tenantId') tenantId: string | null,
  ) {
    return this.service.create(patientId, dto, tenantId);
  }

  @Get()
  findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser('tenantId') tenantId: string | null,
  ) {
    return this.service.findAllByPatient(patientId, tenantId);
  }

  @Get('latest')
  findLatest(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser('tenantId') tenantId: string | null,
  ) {
    return this.service.findLatestByPatient(patientId, tenantId);
  }

  @Get('summary')
  getSummary(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser('tenantId') tenantId: string | null,
  ) {
    return this.service.getSummary(patientId, tenantId);
  }

  @Get(':id')
  findOne(
    @Param('patientId', ParseUUIDPipe) _patientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string | null,
  ) {
    return this.service.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('patientId', ParseUUIDPipe) _patientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePreventiveExamScheduleDto,
    @CurrentUser('tenantId') tenantId: string | null,
  ) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  remove(
    @Param('patientId', ParseUUIDPipe) _patientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string | null,
  ) {
    return this.service.remove(id, tenantId);
  }
}
