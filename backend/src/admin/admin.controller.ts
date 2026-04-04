import { Controller, Get, Post } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Public()
  @Get('health')
  health() {
    return this.service.checkHealth();
  }

  @Get('stats')
  @Roles(UserRole.SUPERADMIN)
  stats() {
    return this.service.getStats();
  }

  @Post('backup/trigger')
  @Roles(UserRole.SUPERADMIN)
  triggerBackup() {
    return this.service.triggerBackup();
  }
}
