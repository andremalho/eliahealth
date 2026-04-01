import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UltrasoundSummaryService } from './ultrasound-summary.service.js';
import { CreateUltrasoundSummaryDto } from './dto/create-ultrasound-summary.dto.js';
import { UpdateUltrasoundSummaryDto } from './dto/update-ultrasound-summary.dto.js';

@Controller()
export class UltrasoundSummaryController {
  constructor(private readonly service: UltrasoundSummaryService) {}

  @Post('pregnancies/:pregnancyId/ultrasound-summaries')
  create(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateUltrasoundSummaryDto,
  ) {
    return this.service.create(pregnancyId, dto);
  }

  @Get('pregnancies/:pregnancyId/ultrasound-summaries')
  findAll(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.findAllByPregnancy(pregnancyId);
  }

  @Get('ultrasound-summaries/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('ultrasound-summaries/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUltrasoundSummaryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post('ultrasound-summaries/:id/extract-from-ai')
  extractFromAi(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.extractFromAi(id);
  }
}
