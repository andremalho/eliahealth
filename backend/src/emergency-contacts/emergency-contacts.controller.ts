import { Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { EmergencyContactsService } from './emergency-contacts.service.js';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto.js';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto.js';

@Controller()
export class EmergencyContactsController {
  constructor(private readonly service: EmergencyContactsService) {}

  @Post('patients/:patientId/emergency-contacts')
  create(@Param('patientId', ParseUUIDPipe) patientId: string, @Body() dto: CreateEmergencyContactDto) {
    return this.service.create(patientId, dto);
  }

  @Get('patients/:patientId/emergency-contacts')
  findAll(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.service.findAll(patientId);
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
