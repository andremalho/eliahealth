import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ContraceptionRecordsService } from './contraception-records.service.js';
import { CreateContraceptionRecordDto } from './dto/create-contraception-record.dto.js';
import { UpdateContraceptionRecordDto } from './dto/update-contraception-record.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('patients/:patientId/contraception-records')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class ContraceptionRecordsController {
  constructor(private readonly service: ContraceptionRecordsService) {}

  @Post()
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateContraceptionRecordDto,
    @CurrentUser('tenantId') tenantId: string | null,
  ) {
    return this.service.create(patientId, dto, tenantId);
  }

  @Get()
  findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser('tenantId') tenantId: string | null,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.service.findAllByPatient(patientId, tenantId, p, l);
  }

  @Get('current')
  findCurrent(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser('tenantId') tenantId: string | null,
  ) {
    return this.service.findCurrent(patientId, tenantId);
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
    @Body() dto: UpdateContraceptionRecordDto,
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
