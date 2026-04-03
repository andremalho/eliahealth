import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';

@Injectable()
export class TenantService {
  constructor(@InjectRepository(Tenant) private readonly repo: Repository<Tenant>) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.repo.create(dto);
    return this.repo.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<Tenant> {
    const t = await this.repo.findOneBy({ id });
    if (!t) throw new NotFoundException(`Tenant ${id} nao encontrado`);
    return t;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const t = await this.findOne(id);
    Object.assign(t, dto);
    return this.repo.save(t);
  }

  async findBySlug(slug: string): Promise<{ name: string; logoUrl: string | null; primaryColor: string | null; secondaryColor: string | null; poweredByVisible: boolean; poweredByText: string }> {
    const t = await this.repo.findOneBy({ slug, isActive: true });
    if (!t) throw new NotFoundException(`Tenant ${slug} nao encontrado`);
    return {
      name: t.name,
      logoUrl: t.logoUrl,
      primaryColor: t.primaryColor,
      secondaryColor: t.secondaryColor,
      poweredByVisible: t.poweredByVisible,
      poweredByText: t.poweredByText,
    };
  }
}
