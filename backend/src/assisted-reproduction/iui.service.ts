import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IuiCycle } from './iui-cycle.entity.js';
import { CreateIuiCycleDto } from './dto/create-iui-cycle.dto.js';
import { UpdateIuiCycleDto } from './dto/update-iui-cycle.dto.js';
import { AssistedReproductionAlert } from './assisted-reproduction.enums.js';
import { verifyPatientTenant } from '../common/tenant.js';

@Injectable()
export class IuiService {
  constructor(
    @InjectRepository(IuiCycle)
    private readonly repo: Repository<IuiCycle>,
  ) {}

  async create(
    patientId: string,
    dto: CreateIuiCycleDto,
    tenantId: string | null,
  ): Promise<IuiCycle> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const cycle = this.repo.create({ ...dto, patientId, tenantId });
    this.evaluateAlerts(cycle);
    return this.repo.save(cycle);
  }

  async findAllByPatient(
    patientId: string,
    tenantId: string | null,
  ): Promise<IuiCycle[]> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const where: Record<string, unknown> = { patientId };
    if (tenantId) where.tenantId = tenantId;
    return this.repo.find({ where, order: { iuiDate: 'DESC' } });
  }

  async findOne(id: string, tenantId: string | null): Promise<IuiCycle> {
    const cycle = await this.repo.findOneBy({ id });
    if (!cycle) throw new NotFoundException(`Ciclo de IIU ${id} nao encontrado`);
    if (tenantId && cycle.tenantId && cycle.tenantId !== tenantId) {
      throw new NotFoundException(`Ciclo de IIU ${id} nao encontrado`);
    }
    return cycle;
  }

  async update(
    id: string,
    dto: UpdateIuiCycleDto,
    tenantId: string | null,
  ): Promise<IuiCycle> {
    const cycle = await this.findOne(id, tenantId);
    Object.assign(cycle, dto);
    this.evaluateAlerts(cycle);
    return this.repo.save(cycle);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    const cycle = await this.findOne(id, tenantId);
    await this.repo.remove(cycle);
  }

  // ── Copiloto ──
  private evaluateAlerts(cycle: IuiCycle): void {
    const alerts: AssistedReproductionAlert[] = [];

    // TMSC pós-preparo < 5M é considerado sub-ótimo para IIU
    if (
      cycle.postWashTotalMotile !== null &&
      Number(cycle.postWashTotalMotile ?? 0) < 5
    ) {
      alerts.push({
        type: 'low_post_wash_tmsc',
        message: `TMSC pós-preparo ${cycle.postWashTotalMotile}M — abaixo do ideal para IIU (≥5M)`,
        severity: 'warning',
      });
    }

    if (
      cycle.postWashTotalMotile !== null &&
      Number(cycle.postWashTotalMotile ?? 0) < 1
    ) {
      alerts.push({
        type: 'very_low_post_wash_tmsc',
        message: `TMSC pós-preparo ${cycle.postWashTotalMotile}M — converter para FIV/ICSI`,
        severity: 'urgent',
      });
    }

    cycle.alerts = alerts.length > 0 ? alerts : null;
  }
}
