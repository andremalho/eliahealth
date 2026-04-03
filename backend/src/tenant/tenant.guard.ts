import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity.js';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectRepository(Tenant) private readonly repo: Repository<Tenant>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Header explícito
    let tenantId = request.headers['x-tenant-id'] as string | undefined;

    // 2. Subdomínio: tenant-slug.eliahealth.com
    if (!tenantId) {
      const host = request.headers['host'] as string | undefined;
      if (host) {
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'api' && subdomain !== 'localhost') {
          const tenant = await this.repo.findOneBy({ slug: subdomain, isActive: true });
          if (tenant) tenantId = tenant.id;
        }
      }
    }

    // Injetar no request para uso nos services
    request.tenantId = tenantId ?? null;
    return true; // Não bloqueia — apenas injeta o contexto
  }
}
