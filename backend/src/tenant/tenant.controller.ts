import { Controller, Get, Post, Patch, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { TenantService } from './tenant.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
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
}
