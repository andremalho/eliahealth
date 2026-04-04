import { Controller, Get, Post, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { PregnancyOutcomeService } from './pregnancy-outcome.service.js';
import { CreatePregnancyOutcomeDto } from './dto/create-pregnancy-outcome.dto.js';
import { UpdatePregnancyOutcomeDto } from './dto/update-pregnancy-outcome.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('pregnancies/:pregnancyId/outcome')
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class PregnancyOutcomeController {
  constructor(private readonly service: PregnancyOutcomeService) {}

  @Post()
  create(@Param('pregnancyId', ParseUUIDPipe) id: string, @Body() dto: CreatePregnancyOutcomeDto) {
    return this.service.create(id, dto);
  }

  @Get()
  findOne(@Param('pregnancyId', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch()
  update(@Param('pregnancyId', ParseUUIDPipe) id: string, @Body() dto: UpdatePregnancyOutcomeDto) {
    return this.service.update(id, dto);
  }
}
