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
import { ClinicalProtocolsService } from './clinical-protocols.service.js';
import { ProtocolCategory } from './clinical-protocol.enums.js';
import { CreateClinicalProtocolDto } from './dto/create-clinical-protocol.dto.js';
import { UpdateClinicalProtocolDto } from './dto/update-clinical-protocol.dto.js';
import { CreateExamScheduleDto } from './dto/create-exam-schedule.dto.js';
import { UploadGuidelineDto } from './dto/upload-guideline.dto.js';

@Controller()
export class ClinicalProtocolsController {
  constructor(private readonly service: ClinicalProtocolsService) {}

  // ── ClinicalProtocol endpoints ──

  @Post('clinical-protocols')
  createProtocol(@Body() dto: CreateClinicalProtocolDto) {
    return this.service.createProtocol(dto);
  }

  @Get('clinical-protocols')
  findAllProtocols(@Query('category') category?: ProtocolCategory) {
    return this.service.findAllProtocols(category);
  }

  @Post('clinical-protocols/upload-guideline')
  uploadGuideline(@Body() dto: UploadGuidelineDto) {
    return this.service.uploadGuideline(dto);
  }

  @Get('clinical-protocols/:id')
  findOneProtocol(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneProtocol(id);
  }

  @Patch('clinical-protocols/:id')
  updateProtocol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClinicalProtocolDto,
  ) {
    return this.service.updateProtocol(id, dto);
  }

  // ── ExamSchedule endpoints ──

  @Get('exam-schedules')
  findAllSchedules() {
    return this.service.findAllSchedules();
  }

  @Post('exam-schedules')
  createSchedule(@Body() dto: CreateExamScheduleDto) {
    return this.service.createSchedule(dto);
  }

  // ── Exam Schedule Check ──

  @Get('pregnancies/:pregnancyId/exam-schedule-check')
  checkExamSchedule(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.checkExamSchedule(pregnancyId);
  }
}
