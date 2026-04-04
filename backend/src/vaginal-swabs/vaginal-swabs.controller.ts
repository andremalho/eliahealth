import { Controller, Get, Post, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { VaginalSwabsService } from './vaginal-swabs.service.js';
import { CreateVaginalSwabDto } from './dto/create-vaginal-swab.dto.js';
import { UpdateVaginalSwabDto } from './dto/update-vaginal-swab.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class VaginalSwabsController {
  constructor(private readonly service: VaginalSwabsService) {}

  @Post('pregnancies/:pregnancyId/vaginal-swabs')
  create(@Param('pregnancyId', ParseUUIDPipe) id: string, @Body() dto: CreateVaginalSwabDto) {
    return this.service.create(id, dto);
  }

  @Get('pregnancies/:pregnancyId/vaginal-swabs')
  findAll(@Param('pregnancyId', ParseUUIDPipe) id: string) { return this.service.findAll(id); }

  @Patch('vaginal-swabs/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVaginalSwabDto) {
    return this.service.update(id, dto);
  }
}
