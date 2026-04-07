import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OvulationInductionCycle } from './ovulation-induction-cycle.entity.js';
import { CreateOvulationInductionCycleDto } from './dto/create-ovulation-induction-cycle.dto.js';
import { UpdateOvulationInductionCycleDto } from './dto/update-ovulation-induction-cycle.dto.js';
import {
  AssistedReproductionAlert,
  OICycleOutcome,
  OHSSGrade,
} from './assisted-reproduction.enums.js';
import { verifyPatientTenant } from '../common/tenant.js';

@Injectable()
export class OvulationInductionService {
  constructor(
    @InjectRepository(OvulationInductionCycle)
    private readonly repo: Repository<OvulationInductionCycle>,
  ) {}

  async create(
    patientId: string,
    dto: CreateOvulationInductionCycleDto,
    tenantId: string | null,
  ): Promise<OvulationInductionCycle> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const cycle = this.repo.create({ ...dto, patientId, tenantId });
    this.evaluateAlerts(cycle);
    return this.repo.save(cycle);
  }

  async findAllByPatient(
    patientId: string,
    tenantId: string | null,
  ): Promise<OvulationInductionCycle[]> {
    await verifyPatientTenant(this.repo, patientId, tenantId);
    const where: Record<string, unknown> = { patientId };
    if (tenantId) where.tenantId = tenantId;
    return this.repo.find({ where, order: { cycleNumber: 'DESC' } });
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<OvulationInductionCycle> {
    const cycle = await this.repo.findOneBy({ id });
    if (!cycle) throw new NotFoundException(`Ciclo de indução ${id} nao encontrado`);
    if (tenantId && cycle.tenantId && cycle.tenantId !== tenantId) {
      throw new NotFoundException(`Ciclo de indução ${id} nao encontrado`);
    }
    return cycle;
  }

  async update(
    id: string,
    dto: UpdateOvulationInductionCycleDto,
    tenantId: string | null,
  ): Promise<OvulationInductionCycle> {
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
  private evaluateAlerts(cycle: OvulationInductionCycle): void {
    const alerts: AssistedReproductionAlert[] = [];

    // Risco de OHSS: > 3 folículos ≥14mm
    if (cycle.folliclesAtTrigger !== null && (cycle.folliclesAtTrigger ?? 0) > 3) {
      alerts.push({
        type: 'ohss_risk',
        message: `${cycle.folliclesAtTrigger} folículos no trigger — risco de OHSS, considerar cancelamento ou conversão para freeze-all`,
        severity: 'warning',
      });
    }

    // Endométrio fino
    if (
      cycle.endometrialThicknessAtTrigger !== null &&
      Number(cycle.endometrialThicknessAtTrigger ?? 0) < 7
    ) {
      alerts.push({
        type: 'thin_endometrium',
        message: `Endométrio ${cycle.endometrialThicknessAtTrigger}mm — espessura subótima`,
        severity: 'warning',
      });
    }

    // E2 muito alto
    if (
      cycle.estradiolAtTrigger !== null &&
      Number(cycle.estradiolAtTrigger ?? 0) > 3000
    ) {
      alerts.push({
        type: 'estradiol_very_high',
        message: `E2 ${cycle.estradiolAtTrigger} pg/mL — alto risco de OHSS`,
        severity: 'urgent',
      });
    }

    // OHSS estabelecida
    if (cycle.ovarianHyperstimulationSyndrome) {
      const isSevere =
        cycle.ohssGrade === OHSSGrade.SEVERE || cycle.ohssGrade === OHSSGrade.CRITICAL;
      alerts.push({
        type: 'ohss_active',
        message: `OHSS ${cycle.ohssGrade ?? ''} — manejo${isSevere ? ' hospitalar urgente' : ' ambulatorial'}`,
        severity: isSevere ? 'urgent' : 'warning',
      });
    }

    // Cancelamento
    if (
      cycle.outcomeType === OICycleOutcome.CANCELLED_OHSS_RISK ||
      cycle.outcomeType === OICycleOutcome.CANCELLED_POOR_RESPONSE ||
      cycle.outcomeType === OICycleOutcome.CANCELLED_CYST
    ) {
      alerts.push({
        type: 'cycle_cancelled',
        message: `Ciclo cancelado: ${cycle.outcomeType}`,
        severity: 'info',
      });
    }

    cycle.alerts = alerts.length > 0 ? alerts : null;
  }
}
