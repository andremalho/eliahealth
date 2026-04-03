import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity.js';
import { TenantService } from './tenant.service.js';
import { TenantController } from './tenant.controller.js';
import { TenantGuard } from './tenant.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantController],
  providers: [TenantService, TenantGuard],
  exports: [TenantService, TenantGuard, TypeOrmModule],
})
export class TenantModule {}
