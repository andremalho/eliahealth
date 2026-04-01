import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service.js';
import { CreateConsultationDto } from './dto/create-consultation.dto.js';
import { UpdateConsultationDto } from './dto/update-consultation.dto.js';

@Controller()
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
  findAllByPregnancy(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.consultationsService.findAllByPregnancy(pregnancyId);
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
