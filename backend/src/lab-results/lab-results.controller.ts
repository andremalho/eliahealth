import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  HttpCode,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.labResultsService.findAllByPregnancy(pregnancyId, { category, status, page: p, limit: l });
  }

  @Get('lab-results/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.labResultsService.findOne(id, tenantId);
  }

  @Patch('lab-results/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateLabResultDto,
  ) {
    return this.labResultsService.update(id, dto);
  }

  @Delete('lab-results/:id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.labResultsService.remove(id);
  }

  @Patch('lab-results/:id/review')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.labResultsService.reviewPatientExam(id, body.status, body.notes);
  }

  // ── LabDocument endpoints ──

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
