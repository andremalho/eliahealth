import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PregnanciesService } from './pregnancies.service.js';
import { CreatePregnancyDto } from './dto/create-pregnancy.dto.js';
import { UpdatePregnancyDto } from './dto/update-pregnancy.dto.js';

@Controller()
export class PregnanciesController {
  constructor(private readonly pregnanciesService: PregnanciesService) {}

  @Post('patients/:patientId/pregnancies')
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreatePregnancyDto,
  ) {
    return this.pregnanciesService.create(patientId, dto);
  }

  @Get('patients/:patientId/pregnancies')
  findAllByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.pregnanciesService.findAllByPatient(patientId);
  }

  @Get('pregnancies/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pregnanciesService.findOne(id);
  }

  @Patch('pregnancies/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePregnancyDto,
  ) {
    return this.pregnanciesService.update(id, dto);
  }

  @Get('pregnancies/:id/gestational-age')
  async getGestationalAge(@Param('id', ParseUUIDPipe) id: string) {
    const pregnancy = await this.pregnanciesService.findOne(id);
    return this.pregnanciesService.getGestationalAge(pregnancy);
  }
}
