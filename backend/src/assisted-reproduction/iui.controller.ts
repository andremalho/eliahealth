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
import { IuiService } from './iui.service.js';
import { CreateIuiCycleDto } from './dto/create-iui-cycle.dto.js';
import { UpdateIuiCycleDto } from './dto/update-iui-cycle.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('patients/:patientId/iui-cycles')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class IuiController {
  constructor(private readonly service: IuiService) {}

  @Post()
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateIuiCycleDto,
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
    @Body() dto: UpdateIuiCycleDto,
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
