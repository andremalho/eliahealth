import { Controller, Get, Post, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { VaccinesService } from './vaccines.service.js';
import { CreateVaccineDto } from './dto/create-vaccine.dto.js';
import { UpdateVaccineDto } from './dto/update-vaccine.dto.js';

@Controller()
export class VaccinesController {
  constructor(private readonly service: VaccinesService) {}

  @Post('pregnancies/:pregnancyId/vaccines')
  create(@Param('pregnancyId', ParseUUIDPipe) id: string, @Body() dto: CreateVaccineDto) {
    return this.service.create(id, dto);
  }

  @Get('pregnancies/:pregnancyId/vaccines')
  findAll(@Param('pregnancyId', ParseUUIDPipe) id: string) {
    return this.service.findAll(id);
  }

  @Get('pregnancies/:pregnancyId/vaccines/pending')
  findPending(@Param('pregnancyId', ParseUUIDPipe) id: string) {
    return this.service.findPending(id);
  }

  @Patch('vaccines/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVaccineDto) {
    return this.service.update(id, dto);
  }
}
