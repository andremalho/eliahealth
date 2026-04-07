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
import { InfertilityWorkupsService } from './infertility-workups.service.js';
import { CreateInfertilityWorkupDto } from './dto/create-infertility-workup.dto.js';
import { UpdateInfertilityWorkupDto } from './dto/update-infertility-workup.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('patients/:patientId/infertility-workups')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class InfertilityWorkupsController {
  constructor(private readonly service: InfertilityWorkupsService) {}

  @Post()
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateInfertilityWorkupDto,
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
    @Body() dto: UpdateInfertilityWorkupDto,
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
