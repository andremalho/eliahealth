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
import { OvulationInductionService } from './ovulation-induction.service.js';
import { CreateOvulationInductionCycleDto } from './dto/create-ovulation-induction-cycle.dto.js';
import { UpdateOvulationInductionCycleDto } from './dto/update-ovulation-induction-cycle.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('patients/:patientId/ovulation-induction-cycles')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class OvulationInductionController {
  constructor(private readonly service: OvulationInductionService) {}

  @Post()
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateOvulationInductionCycleDto,
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
    @Body() dto: UpdateOvulationInductionCycleDto,
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
