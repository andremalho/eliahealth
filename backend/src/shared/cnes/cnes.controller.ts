import { Controller, Get, Param } from '@nestjs/common';
import { CnesService } from './cnes.service.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/auth.enums.js';

@Controller('admin/cnes')
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class CnesController {
  constructor(private readonly service: CnesService) {}

  @Get(':code')
  lookup(@Param('code') code: string) {
    return this.service.getCnesInfo(code);
  }
}
