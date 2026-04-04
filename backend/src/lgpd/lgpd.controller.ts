import { Controller, Get, Post, Delete, Body, Req } from '@nestjs/common';
import { LgpdService } from './lgpd.service.js';
import { ConsentType } from './lgpd-consent.entity.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('lgpd')
@Roles(UserRole.PATIENT)
export class LgpdController {
  constructor(private readonly service: LgpdService) {}

  @Get('my-data')
  exportMyData(@CurrentUser('patientId') patientId: string) {
    return this.service.exportMyData(patientId);
  }

  @Delete('my-data')
  requestDeletion(@CurrentUser('patientId') patientId: string) {
    return this.service.requestDeletion(patientId);
  }

  @Get('consent')
  getConsents(@CurrentUser('patientId') patientId: string) {
    return this.service.getConsents(patientId);
  }

  @Post('consent')
  registerConsent(
    @CurrentUser('patientId') patientId: string,
    @Req() req: any,
    @Body() body: { consentType: ConsentType; granted: boolean; version: string; termText: string },
  ) {
    return this.service.registerConsent(patientId, {
      ...body,
      ipAddress: req.ip ?? req.socket?.remoteAddress ?? 'unknown',
    });
  }

  @Get('access-log')
  getAccessLog(@CurrentUser('patientId') patientId: string) {
    return this.service.getAccessLog(patientId);
  }

  @Post('data-portability')
  exportPortability(@CurrentUser('patientId') patientId: string) {
    return this.service.exportPortability(patientId);
  }
}
