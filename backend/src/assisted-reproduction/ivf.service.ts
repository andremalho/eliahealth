import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IvfCycle } from './ivf-cycle.entity.js';
import { CreateIvfCycleDto } from './dto/create-ivf-cycle.dto.js';
import { UpdateIvfCycleDto } from './dto/update-ivf-cycle.dto.js';
import {
  AssistedReproductionAlert,
  OHSSGrade,
} from './assisted-reproduction.enums.js';
import { verifyPatientTenant } from '../common/tenant.js';

@Injectable()
export class IvfService {
  constructor(
    @InjectRepository(IvfCycle)
    private readonly repo: Repository<IvfCycle>,
  ) {}

  async create(
    patientId: string,
    dto: CreateIvfCycleDto,
    tenantId: string | null,
  ): Promise<IvfCycle> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const cycle = this.repo.create({ ...dto, patientId, tenantId });
    this.computeFertilizationRate(cycle);
    this.evaluateAlerts(cycle);
    return this.repo.save(cycle);
  }

  async findAllByPatient(
    patientId: string,
    tenantId: string | null,
  ): Promise<IvfCycle[]> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const where: Record<string, unknown> = { patientId };
    if (tenantId) where.tenantId = tenantId;
    return this.repo.find({ where, order: { cycleNumber: 'DESC' } });
  }

  async findOne(id: string, tenantId: string | null): Promise<IvfCycle> {
    const cycle = await this.repo.findOneBy({ id });
    if (!cycle) throw new NotFoundException(`Ciclo de FIV ${id} nao encontrado`);
    if (tenantId && cycle.tenantId && cycle.tenantId !== tenantId) {
      throw new NotFoundException(`Ciclo de FIV ${id} nao encontrado`);
    }
    return cycle;
  }

  async update(
    id: string,
    dto: UpdateIvfCycleDto,
    tenantId: string | null,
  ): Promise<IvfCycle> {
    const cycle = await this.findOne(id, tenantId);
    Object.assign(cycle, dto);
    this.computeFertilizationRate(cycle);
    this.evaluateAlerts(cycle);
    return this.repo.save(cycle);
  }

  async remove(id: string, tenantId: string | null): Promise<void> {
    const cycle = await this.findOne(id, tenantId);
    await this.repo.remove(cycle);
  }

  // ── Cálculo automático ──
  private computeFertilizationRate(cycle: IvfCycle): void {
    if (
      cycle.fertilized2PN !== null &&
      cycle.miiOocytes !== null &&
      (cycle.miiOocytes ?? 0) > 0
    ) {
      cycle.fertilizationRate = Number(
        (
          ((cycle.fertilized2PN ?? 0) / (cycle.miiOocytes ?? 1)) *
          100
        ).toFixed(2),
      );
    }
  }

  // ── Copiloto ──
  private evaluateAlerts(cycle: IvfCycle): void {
    const alerts: AssistedReproductionAlert[] = [];

    // OHSS estabelecida
    if (cycle.ovarianHyperstimulationSyndrome) {
      const isSevere =
        cycle.ohssGrade === OHSSGrade.SEVERE ||
        cycle.ohssGrade === OHSSGrade.CRITICAL;
      alerts.push({
        type: 'ohss_active',
        message: `OHSS ${cycle.ohssGrade ?? ''} — manejo${isSevere ? ' hospitalar urgente' : ' ambulatorial'}`,
        severity: isSevere ? 'urgent' : 'warning',
      });
    }

    // Coorte folicular ampla → risco OHSS retrospectivo
    if (
      cycle.totalOocytesRetrieved !== null &&
      (cycle.totalOocytesRetrieved ?? 0) > 18
    ) {
      alerts.push({
        type: 'high_oocyte_yield',
        message: `${cycle.totalOocytesRetrieved} oócitos captados — alto risco de OHSS, considerar freeze-all`,
        severity: 'warning',
      });
    }

    // Resposta pobre (Bologna)
    if (
      cycle.totalOocytesRetrieved !== null &&
      (cycle.totalOocytesRetrieved ?? 0) <= 3
    ) {
      alerts.push({
        type: 'poor_response',
        message: `Resposta pobre (${cycle.totalOocytesRetrieved} oócitos) — critérios de Bologna`,
        severity: 'warning',
      });
    }

    // Taxa de fertilização baixa
    if (cycle.fertilizationRate !== null && Number(cycle.fertilizationRate ?? 0) < 50) {
      alerts.push({
        type: 'low_fertilization_rate',
        message: `Taxa de fertilização ${cycle.fertilizationRate}% — abaixo do esperado`,
        severity: 'warning',
      });
    }

    // E2 muito alto
    if (cycle.peakEstradiol !== null && Number(cycle.peakEstradiol ?? 0) > 5000) {
      alerts.push({
        type: 'estradiol_critical',
        message: `E2 pico ${cycle.peakEstradiol} pg/mL — risco crítico de OHSS, recomendar freeze-all`,
        severity: 'urgent',
      });
    }

    // Endométrio fino na transferência
    if (
      cycle.endometrialThicknessAtTransfer !== null &&
      Number(cycle.endometrialThicknessAtTransfer ?? 0) < 7
    ) {
      alerts.push({
        type: 'thin_endometrium_transfer',
        message: `Endométrio ${cycle.endometrialThicknessAtTransfer}mm na transferência — espessura subótima`,
        severity: 'warning',
      });
    }

    // Múltiplos embriões transferidos (recomenda-se SET)
    if (cycle.embryosTransferred !== null && (cycle.embryosTransferred ?? 0) > 1) {
      alerts.push({
        type: 'multiple_embryo_transfer',
        message: `${cycle.embryosTransferred} embriões transferidos — risco de gestação múltipla`,
        severity: 'info',
      });
    }

    cycle.alerts = alerts.length > 0 ? alerts : null;
  }
}
