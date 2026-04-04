import { Controller, Get, Post, Patch, Param, Query, Body, ParseUUIDPipe } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service.js';
import { CreatePrescriptionDto } from './dto/create-prescription.dto.js';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  @Post('pregnancies/:pregnancyId/prescriptions')
  create(
    @Param('pregnancyId', ParseUUIDPipe) id: string,
    @CurrentUser('userId') prescribedBy: string,
    @Body() dto: CreatePrescriptionDto,
  ) { return this.service.create(id, prescribedBy, dto); }

  @Get('pregnancies/:pregnancyId/prescriptions')
  findAll(@Param('pregnancyId', ParseUUIDPipe) id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.service.findAll(id, p, l);
  }

  @Get('pregnancies/:pregnancyId/prescriptions/active')
  findActive(@Param('pregnancyId', ParseUUIDPipe) id: string) { return this.service.findActive(id); }

  @Get('prescriptions/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Patch('prescriptions/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('tenantId') tenantId: string, @Body() dto: UpdatePrescriptionDto) {
    return this.service.update(id, dto, tenantId);
  }

  @Post('prescriptions/:id/sign')
  sign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { provider: string; signatureToken: string },
  ) {
    return this.service.sign(id, body.provider, body.signatureToken);
  }

  @Get('prescriptions/memed-token')
  memedToken(@CurrentUser('userId') userId: string) {
    return this.service.generateMemedToken(userId);
  }
}
