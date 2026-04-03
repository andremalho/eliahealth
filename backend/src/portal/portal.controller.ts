import { Controller, Post, Patch, Get, Body, Query } from '@nestjs/common';
import { PortalService } from './portal.service.js';
import { UpdatePortalProfileDto } from './dto/update-portal-profile.dto.js';
import { CompleteProfileDto } from './dto/complete-profile.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Public()
  @Post('verify')
  verify(@Query('token') token: string) {
    return this.portalService.verify(token);
  }

  @Post('complete-profile')
  @Roles(UserRole.PATIENT)
  completeProfile(
    @CurrentUser('patientId') patientId: string,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.portalService.completeProfile(patientId, dto);
  }

  @Patch('profile')
  @Roles(UserRole.PATIENT)
  updateProfile(
    @CurrentUser('patientId') patientId: string,
    @Body() dto: UpdatePortalProfileDto,
  ) {
    return this.portalService.updateProfile(patientId, dto);
  }
}
