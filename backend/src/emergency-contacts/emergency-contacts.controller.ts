import { Controller, Get, Post, Patch, Delete, Param, Query, Body, ParseUUIDPipe } from '@nestjs/common';
import { EmergencyContactsService } from './emergency-contacts.service.js';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto.js';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN, UserRole.NURSE)
export class EmergencyContactsController {
  constructor(private readonly service: EmergencyContactsService) {}

  @Post('patients/:patientId/emergency-contacts')
  create(@Param('patientId', ParseUUIDPipe) patientId: string, @Body() dto: CreateEmergencyContactDto) {
    return this.service.create(patientId, dto);
  }

  @Get('patients/:patientId/emergency-contacts')
  findAll(@Param('patientId', ParseUUIDPipe) patientId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.service.findAll(patientId, p, l);
  }

  @Patch('emergency-contacts/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmergencyContactDto) {
    return this.service.update(id, dto);
  }

  @Delete('emergency-contacts/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
