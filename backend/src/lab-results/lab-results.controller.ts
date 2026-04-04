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
import { LabResultsService } from './lab-results.service.js';
import { ExamCategory, LabResultStatus } from './lab-result.enums.js';
import { CreateLabResultDto } from './dto/create-lab-result.dto.js';
import { UpdateLabResultDto } from './dto/update-lab-result.dto.js';
import { CreateLabDocumentDto } from './dto/create-lab-document.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class LabResultsController {
  constructor(private readonly labResultsService: LabResultsService) {}

  // ── LabResult endpoints ──

  @Post('pregnancies/:pregnancyId/lab-results')
  create(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateLabResultDto,
  ) {
    return this.labResultsService.create(pregnancyId, dto);
  }

  @Get('pregnancies/:pregnancyId/lab-results/timeline')
  timeline(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.labResultsService.findTimeline(pregnancyId);
  }

  @Get('pregnancies/:pregnancyId/lab-results/alerts')
  alerts(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.labResultsService.findAlerts(pregnancyId);
  }

  @Get('pregnancies/:pregnancyId/lab-results')
  findAll(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Query('category') category?: ExamCategory,
    @Query('status') status?: LabResultStatus,
  ) {
    return this.labResultsService.findAllByPregnancy(pregnancyId, { category, status });
  }

  @Get('lab-results/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.labResultsService.findOne(id);
  }

  @Patch('lab-results/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLabResultDto,
  ) {
    return this.labResultsService.update(id, dto);
  }

  // ── LabDocument endpoints ──
  // TODO: integração com laboratórios — adicionar endpoint POST /lab-results/webhook para receber resultados de sistemas externos

  @Post('pregnancies/:pregnancyId/lab-documents')
  createDocument(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateLabDocumentDto,
  ) {
    return this.labResultsService.createDocument(pregnancyId, dto);
  }

  @Get('pregnancies/:pregnancyId/lab-documents')
  findDocuments(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.labResultsService.findDocumentsByPregnancy(pregnancyId);
  }
}
