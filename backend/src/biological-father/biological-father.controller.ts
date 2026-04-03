import { Controller, Get, Post, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { BiologicalFatherService } from './biological-father.service.js';
import { CreateBiologicalFatherDto } from './dto/create-biological-father.dto.js';
import { UpdateBiologicalFatherDto } from './dto/update-biological-father.dto.js';

@Controller('pregnancies/:pregnancyId/biological-father')
export class BiologicalFatherController {
  constructor(private readonly service: BiologicalFatherService) {}

  @Post() create(@Param('pregnancyId', ParseUUIDPipe) id: string, @Body() dto: CreateBiologicalFatherDto) {
    return this.service.create(id, dto);
  }
  @Get() findOne(@Param('pregnancyId', ParseUUIDPipe) id: string) { return this.service.findOne(id); }
  @Patch() update(@Param('pregnancyId', ParseUUIDPipe) id: string, @Body() dto: UpdateBiologicalFatherDto) {
    return this.service.update(id, dto);
  }
}
