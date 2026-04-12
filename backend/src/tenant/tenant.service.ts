import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity.js';
import { TenantConfig, TenantType } from './tenant-config.entity.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant) private readonly repo: Repository<Tenant>,
    @InjectRepository(TenantConfig) private readonly configRepo: Repository<TenantConfig>,
  ) {}

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

  // ── Tenant Config (modules) ──

  async getConfig(tenantId: string): Promise<TenantConfig> {
    let config = await this.configRepo.findOneBy({ tenantId });
    if (!config) {
      // Auto-create default config
      config = this.configRepo.create({
        tenantId,
        name: 'EliaHealth',
        type: TenantType.CONSULTORIO,
        ...TenantConfig.presets()[TenantType.CONSULTORIO],
      });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(tenantId: string, dto: Partial<TenantConfig>): Promise<TenantConfig> {
    const config = await this.getConfig(tenantId);
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }

  async setTenantType(tenantId: string, type: TenantType): Promise<TenantConfig> {
    const config = await this.getConfig(tenantId);
    config.type = type;
    Object.assign(config, TenantConfig.presets()[type]);
    return this.configRepo.save(config);
  }

  async getActiveModules(tenantId: string): Promise<string[]> {
    const config = await this.getConfig(tenantId);
    const modules: string[] = [];
    if (config.modPrenatal) modules.push('prenatal');
    if (config.modGynecology) modules.push('gynecology');
    if (config.modUltrasound) modules.push('ultrasound');
    if (config.modPostpartum) modules.push('postpartum');
    if (config.modInfertility) modules.push('infertility');
    if (config.modAssistedReproduction) modules.push('assisted_reproduction');
    if (config.modMenopause) modules.push('menopause');
    if (config.modClinicalGeneral) modules.push('clinical_general');
    if (config.modHospitalization) modules.push('hospitalization');
    if (config.modEvolution) modules.push('evolution');
    if (config.modPortal) modules.push('portal');
    if (config.modScheduling) modules.push('scheduling');
    if (config.modResearch) modules.push('research');
    if (config.modTelemedicine) modules.push('telemedicine');
    if (config.modTissBilling) modules.push('tiss_billing');
    if (config.modFhirRnds) modules.push('fhir_rnds');
    return modules;
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
