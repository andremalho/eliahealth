import { Controller, Get, Post, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service.js';
import { CreatePrescriptionDto } from './dto/create-prescription.dto.js';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller()
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  @Post('pregnancies/:pregnancyId/prescriptions')
  create(
    @Param('pregnancyId', ParseUUIDPipe) id: string,
    @CurrentUser('userId') prescribedBy: string,
    @Body() dto: CreatePrescriptionDto,
  ) { return this.service.create(id, prescribedBy, dto); }

  @Get('pregnancies/:pregnancyId/prescriptions')
  findAll(@Param('pregnancyId', ParseUUIDPipe) id: string) { return this.service.findAll(id); }

  @Get('pregnancies/:pregnancyId/prescriptions/active')
  findActive(@Param('pregnancyId', ParseUUIDPipe) id: string) { return this.service.findActive(id); }

  @Get('prescriptions/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(id); }

  @Patch('prescriptions/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePrescriptionDto) {
    return this.service.update(id, dto);
  }
}
