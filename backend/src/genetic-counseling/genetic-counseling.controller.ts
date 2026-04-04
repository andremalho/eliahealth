import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GeneticCounselingService } from './genetic-counseling.service.js';
import { CreateGeneticCounselingDto } from './dto/create-genetic-counseling.dto.js';
import { UpdateGeneticCounselingDto } from './dto/update-genetic-counseling.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class GeneticCounselingController {
  constructor(private readonly service: GeneticCounselingService) {}

  @Post('pregnancies/:pregnancyId/genetic-counseling')
  create(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Body() dto: CreateGeneticCounselingDto,
  ) {
    return this.service.create(pregnancyId, dto);
  }

  @Get('pregnancies/:pregnancyId/genetic-counseling')
  findAll(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.findAllByPregnancy(pregnancyId);
  }

  @Get('genetic-counseling/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('genetic-counseling/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGeneticCounselingDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post('genetic-counseling/:id/interpret')
  interpret(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.interpret(id);
  }
}
