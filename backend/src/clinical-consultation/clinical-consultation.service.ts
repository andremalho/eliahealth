import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalConsultation } from './clinical-consultation.entity.js';

@Injectable()
export class ClinicalConsultationService {
  constructor(
    @InjectRepository(ClinicalConsultation)
    private readonly repo: Repository<ClinicalConsultation>,
  ) {}

  async create(dto: Partial<ClinicalConsultation>, doctorId: string, tenantId?: string): Promise<ClinicalConsultation> {
    const consultation = this.repo.create({
      ...dto,
      doctorId,
      tenantId: tenantId ?? null,
    });
    this.evaluateAlerts(consultation);
    return this.repo.save(consultation);
  }

  async findByPatient(patientId: string, page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      where: { patientId },
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<ClinicalConsultation> {
    const c = await this.repo.findOneBy({ id });
    if (!c) throw new NotFoundException('Consulta nao encontrada');
    return c;
  }

  async update(id: string, dto: Partial<ClinicalConsultation>): Promise<ClinicalConsultation> {
    const c = await this.findOne(id);
    Object.assign(c, dto);
    this.evaluateAlerts(c);
    return this.repo.save(c);
  }

  async remove(id: string): Promise<void> {
    const c = await this.findOne(id);
    await this.repo.remove(c);
  }

  private evaluateAlerts(c: ClinicalConsultation): void {
    const alerts: { level: string; message: string }[] = [];
    if (c.bpSystolic && c.bpDiastolic) {
      if (c.bpSystolic >= 180 || c.bpDiastolic >= 120)
        alerts.push({ level: 'critical', message: 'Crise hipertensiva — atendimento urgente' });
      else if (c.bpSystolic >= 140 || c.bpDiastolic >= 90)
        alerts.push({ level: 'attention', message: 'PA elevada — monitorar' });
    }
    if (c.temperature && Number(c.temperature) >= 38.5)
      alerts.push({ level: 'urgent', message: `Febre (${c.temperature}°C) — investigar foco` });
    if (c.spo2 && c.spo2 < 92)
      alerts.push({ level: 'critical', message: `SpO2 ${c.spo2}% — hipoxemia` });
    if (c.heartRate && (c.heartRate > 120 || c.heartRate < 50))
      alerts.push({ level: 'attention', message: `FC ${c.heartRate} bpm — avaliar` });
    c.alerts = alerts.length > 0 ? alerts : null;
  }
}
