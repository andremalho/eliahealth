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
import { ConsultationsService } from './consultations.service.js';
import { CreateConsultationDto } from './dto/create-consultation.dto.js';
import { UpdateConsultationDto } from './dto/update-consultation.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post('pregnancies/:pregnancyId/consultations')
  create(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateConsultationDto,
  ) {
    return this.consultationsService.create(pregnancyId, dto);
  }

  @Get('pregnancies/:pregnancyId/consultations')
  findAllByPregnancy(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.consultationsService.findAllByPregnancy(pregnancyId, p, l);
  }

  @Get('consultations/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.findOne(id);
  }

  @Patch('consultations/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultationDto,
  ) {
    return this.consultationsService.update(id, dto);
  }
}
