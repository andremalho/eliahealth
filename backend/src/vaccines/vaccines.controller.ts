import { Controller, Get, Post, Patch, Param, Query, Body, ParseUUIDPipe } from '@nestjs/common';
import { VaccinesService } from './vaccines.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateVaccineDto } from './dto/create-vaccine.dto.js';
import { UpdateVaccineDto } from './dto/update-vaccine.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class VaccinesController {
  constructor(private readonly service: VaccinesService) {}

  @Post('pregnancies/:pregnancyId/vaccines')
  create(@Param('pregnancyId', ParseUUIDPipe) id: string, @Body() dto: CreateVaccineDto) {
    return this.service.create(id, dto);
  }

  @Get('pregnancies/:pregnancyId/vaccines')
  findAll(@Param('pregnancyId', ParseUUIDPipe) id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.service.findAll(id, p, l);
  }

  @Get('pregnancies/:pregnancyId/vaccines/pending')
  findPending(@Param('pregnancyId', ParseUUIDPipe) id: string) {
    return this.service.findPending(id);
  }

  @Get('pregnancies/:pregnancyId/vaccines/card')
  getVaccineCard(@Param('pregnancyId', ParseUUIDPipe) id: string) {
    return this.service.getVaccineCard(id);
  }

  @Patch('vaccines/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('tenantId') tenantId: string, @Body() dto: UpdateVaccineDto) {
    return this.service.update(id, dto, tenantId);
  }
}
