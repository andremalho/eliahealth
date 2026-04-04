import { Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { OtherExamsService } from './other-exams.service.js';
import { CreateOtherExamDto } from './dto/create-other-exam.dto.js';
import { UpdateOtherExamDto } from './dto/update-other-exam.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class OtherExamsController {
  constructor(private readonly service: OtherExamsService) {}

  @Post('pregnancies/:pregnancyId/other-exams')
  create(
    @Param('pregnancyId', ParseUUIDPipe) id: string,
    @Body() dto: CreateOtherExamDto,
  ) {
    return this.service.create(id, dto);
  }

  @Get('pregnancies/:pregnancyId/other-exams')
  findAll(@Param('pregnancyId', ParseUUIDPipe) id: string) {
    return this.service.findAll(id);
  }

  @Patch('other-exams/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOtherExamDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete('other-exams/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
