import { Controller, Get, Post, Patch, Param, Body, Headers } from '@nestjs/common';
import { LabIntegrationsService } from './lab-integrations.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
export class LabIntegrationsController {
  constructor(private readonly service: LabIntegrationsService) {}

  @Public()
  @Post('lab-integrations/webhook/:labCode')
  webhook(
    @Param('labCode') labCode: string,
    @Body() payload: Record<string, unknown>,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.service.processWebhook(labCode, payload, signature);
  }

  @Get('admin/lab-integrations')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  findAll() {
    return this.service.findAll();
  }

  @Post('admin/lab-integrations')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body as any);
  }

  @Patch('admin/lab-integrations/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body as any);
  }
}
