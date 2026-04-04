import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UltrasoundSummaryService } from './ultrasound-summary.service.js';
import { CreateUltrasoundSummaryDto } from './dto/create-ultrasound-summary.dto.js';
import { UpdateUltrasoundSummaryDto } from './dto/update-ultrasound-summary.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
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
  findAll(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.service.findAllByPregnancy(pregnancyId, p, l);
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
