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
import { PregnanciesService } from './pregnancies.service.js';
import { CreatePregnancyDto } from './dto/create-pregnancy.dto.js';
import { UpdatePregnancyDto } from './dto/update-pregnancy.dto.js';
import { QuickCreatePregnancyDto } from './dto/quick-create-pregnancy.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
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
  findAllByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('ownership') ownership?: string,
  ) {
    return this.pregnanciesService.findAllByPatient(patientId, {
      status,
      sort,
      ownership,
    });
  }

  @Post('pregnancies/quick-create')
  quickCreate(@Body() dto: QuickCreatePregnancyDto) {
    return this.pregnanciesService.quickCreate(dto);
  }

  @Get('pregnancies/list')
  list(
    @CurrentUser('userId') userId: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('ownership') ownership?: string,
    @Query('search') search?: string,
  ) {
    return this.pregnanciesService.list({
      status,
      sort,
      ownership,
      search,
      userId,
    });
  }

  @Get('pregnancies/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.pregnanciesService.findOneWithStats(id, tenantId);
  }

  @Patch('pregnancies/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdatePregnancyDto,
  ) {
    return this.pregnanciesService.update(id, dto, tenantId);
  }

  @Get('pregnancies/:id/gestational-age')
  async getGestationalAge(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('tenantId') tenantId: string) {
    const pregnancy = await this.pregnanciesService.findOne(id, tenantId);
    return this.pregnanciesService.getGestationalAge(pregnancy);
  }
}
