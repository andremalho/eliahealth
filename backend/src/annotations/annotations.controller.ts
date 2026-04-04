import { Controller, Get, Post, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { AnnotationsService } from './annotations.service.js';
import { CreateAnnotationDto } from './dto/create-annotation.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class AnnotationsController {
  constructor(private readonly service: AnnotationsService) {}

  @Post('pregnancies/:pregnancyId/annotations')
  create(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @CurrentUser('userId') authorId: string,
    @Body() dto: CreateAnnotationDto,
  ) {
    return this.service.create(pregnancyId, authorId, dto);
  }

  @Get('pregnancies/:pregnancyId/annotations')
  findAll(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.findAll(pregnancyId);
  }

  @Delete('annotations/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
