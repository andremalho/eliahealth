import { Controller, Get, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AuthService } from '../auth/auth.service.js';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly service: AdminService,
    private readonly authService: AuthService,
  ) {}

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

  @Post('users')
  @Roles(UserRole.SUPERADMIN)
  createUser(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
