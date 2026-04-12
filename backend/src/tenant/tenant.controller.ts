import { Controller, Get, Post, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { TenantService } from './tenant.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { TenantType } from './tenant-config.entity.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('tenants')
export class TenantController {
  constructor(private readonly service: TenantService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN)
  create(@Body() dto: CreateTenantDto) { return this.service.create(dto); }

  @Get()
  @Roles(UserRole.SUPERADMIN)
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(id); }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.service.update(id, dto);
  }

  @Public()
  @Get(':slug/config')
  findBySlug(@Param('slug') slug: string) { return this.service.findBySlug(slug); }

  // ── Tenant Module Config ──

  @Get('my/modules')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  getMyModules(@CurrentUser('tenantId') tenantId: string) {
    return this.service.getActiveModules(tenantId ?? 'default');
  }

  @Get('my/config')
  @Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
  getMyConfig(@CurrentUser('tenantId') tenantId: string) {
    return this.service.getConfig(tenantId ?? 'default');
  }

  @Patch('my/config')
  @Roles(UserRole.ADMIN)
  updateMyConfig(@CurrentUser('tenantId') tenantId: string, @Body() dto: Record<string, unknown>) {
    return this.service.updateConfig(tenantId ?? 'default', dto as any);
  }

  @Post('my/type')
  @Roles(UserRole.ADMIN)
  setMyType(@CurrentUser('tenantId') tenantId: string, @Body() body: { type: TenantType }) {
    return this.service.setTenantType(tenantId ?? 'default', body.type);
  }
}
