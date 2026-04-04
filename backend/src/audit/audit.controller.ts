import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get('logs')
  @Roles(UserRole.SUPERADMIN)
  findAll(
    @Query('patientId') patientId?: string,
    @Query('userId') userId?: string,
    @Query('resource') resource?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.findAll({
      patientId,
      userId,
      resource,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('my-access')
  @Roles(UserRole.PATIENT)
  myAccess(@CurrentUser('patientId') patientId: string) {
    return this.service.findPatientAccessLog(patientId);
  }
}
