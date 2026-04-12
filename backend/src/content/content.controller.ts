import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ContentService } from './content.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('content')
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Post()
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  create(@Body() dto: Record<string, unknown>) { return this.service.create(dto as any); }

  @Get()
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  findAll(@Query('category') category?: string) { return this.service.findAll(category); }

  @Get('patient')
  @Roles(UserRole.PATIENT)
  findForPatient(@Query('gaWeek') gaWeek?: string) {
    return this.service.findForPatient(gaWeek ? parseInt(gaWeek) : undefined);
  }

  @Get(':id')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.PATIENT)
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) { return this.service.update(id, dto as any); }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string) { return this.service.delete(id); }
}
