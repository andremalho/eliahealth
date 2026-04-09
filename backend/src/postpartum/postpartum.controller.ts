import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { PostpartumService } from './postpartum.service.js';
import { CreatePostpartumConsultationDto } from './dto/create-postpartum-consultation.dto.js';
import { UpdatePostpartumConsultationDto } from './dto/update-postpartum-consultation.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
export class PostpartumController {
  constructor(private readonly service: PostpartumService) {}

  @Post('pregnancies/:pregnancyId/postpartum-consultations')
  @Roles(UserRole.PHYSICIAN, UserRole.NURSE, UserRole.ADMIN)
  create(
    @Param('pregnancyId') pregnancyId: string,
    @Body() dto: CreatePostpartumConsultationDto,
  ) {
    return this.service.create(pregnancyId, dto);
  }

  @Get('pregnancies/:pregnancyId/postpartum-consultations')
  @Roles(UserRole.PHYSICIAN, UserRole.NURSE, UserRole.ADMIN)
  findAll(@Param('pregnancyId') pregnancyId: string) {
    return this.service.findAllByPregnancy(pregnancyId);
  }

  @Get('patients/:patientId/postpartum-consultations')
  @Roles(UserRole.PHYSICIAN, UserRole.NURSE, UserRole.ADMIN)
  findAllByPatient(@Param('patientId') patientId: string) {
    return this.service.findAllByPatient(patientId);
  }

  @Get('postpartum-consultations/:id')
  @Roles(UserRole.PHYSICIAN, UserRole.NURSE, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('postpartum-consultations/:id')
  @Roles(UserRole.PHYSICIAN, UserRole.NURSE, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostpartumConsultationDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete('postpartum-consultations/:id')
  @Roles(UserRole.PHYSICIAN, UserRole.NURSE, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
