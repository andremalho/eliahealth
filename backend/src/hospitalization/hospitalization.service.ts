import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hospitalization, AdmissionStatus } from './hospitalization.entity.js';
import { Evolution } from './evolution.entity.js';

@Injectable()
export class HospitalizationService {
  constructor(
    @InjectRepository(Hospitalization) private readonly hospRepo: Repository<Hospitalization>,
    @InjectRepository(Evolution) private readonly evoRepo: Repository<Evolution>,
  ) {}

  // ── Internações ──

  async admit(dto: Partial<Hospitalization>): Promise<Hospitalization> {
    const hosp = this.hospRepo.create({ ...dto, status: AdmissionStatus.ACTIVE });
    return this.hospRepo.save(hosp);
  }

  async findActive(tenantId?: string) {
    const qb = this.hospRepo.createQueryBuilder('h')
      .leftJoinAndSelect('h.patient', 'p')
      .leftJoinAndSelect('h.attendingDoctor', 'd')
      .where('h.status = :status', { status: AdmissionStatus.ACTIVE })
      .orderBy('h.admissionDate', 'DESC');
    if (tenantId) qb.andWhere('h.tenantId = :tenantId', { tenantId });
    return qb.getMany();
  }

  async findByPatient(patientId: string) {
    return this.hospRepo.find({
      where: { patientId },
      relations: ['attendingDoctor'],
      order: { admissionDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Hospitalization> {
    const h = await this.hospRepo.findOne({ where: { id }, relations: ['patient', 'attendingDoctor'] });
    if (!h) throw new NotFoundException('Internacao nao encontrada');
    return h;
  }

  async discharge(id: string, dto: { dischargeSummary: string; dischargeDiagnosis?: string; dischargeInstructions?: string }) {
    const h = await this.findOne(id);
    if (h.status !== AdmissionStatus.ACTIVE) throw new BadRequestException('Paciente ja teve alta');
    h.status = AdmissionStatus.DISCHARGED;
    h.dischargeDate = new Date();
    h.dischargeSummary = dto.dischargeSummary;
    h.dischargeDiagnosis = dto.dischargeDiagnosis ?? null;
    h.dischargeInstructions = dto.dischargeInstructions ?? null;
    return this.hospRepo.save(h);
  }

  async update(id: string, dto: Partial<Hospitalization>) {
    const h = await this.findOne(id);
    Object.assign(h, dto);
    return this.hospRepo.save(h);
  }

  // ── Evoluções ──

  async addEvolution(hospitalizationId: string, dto: Partial<Evolution>, authorId: string): Promise<Evolution> {
    await this.findOne(hospitalizationId); // validate exists
    const evo = this.evoRepo.create({
      ...dto,
      hospitalizationId,
      authorId,
      evolutionDate: dto.evolutionDate ?? new Date(),
    });
    this.evaluateAlerts(evo);
    return this.evoRepo.save(evo);
  }

  async getEvolutions(hospitalizationId: string) {
    return this.evoRepo.find({
      where: { hospitalizationId },
      relations: ['author'],
      order: { evolutionDate: 'DESC' },
    });
  }

  async updateEvolution(id: string, dto: Partial<Evolution>) {
    const evo = await this.evoRepo.findOneBy({ id });
    if (!evo) throw new NotFoundException('Evolucao nao encontrada');
    Object.assign(evo, dto);
    this.evaluateAlerts(evo);
    return this.evoRepo.save(evo);
  }

  async deleteEvolution(id: string) {
    const evo = await this.evoRepo.findOneBy({ id });
    if (!evo) throw new NotFoundException('Evolucao nao encontrada');
    await this.evoRepo.remove(evo);
  }

  private evaluateAlerts(evo: Evolution): void {
    const alerts: { level: string; message: string }[] = [];
    if (evo.bpSystolic && evo.bpDiastolic) {
      if (evo.bpSystolic >= 160 || evo.bpDiastolic >= 110)
        alerts.push({ level: 'critical', message: 'PA severamente elevada — emergencia hipertensiva' });
      else if (evo.bpSystolic >= 140 || evo.bpDiastolic >= 90)
        alerts.push({ level: 'urgent', message: 'PA elevada — monitorar de perto' });
    }
    if (evo.temperature && Number(evo.temperature) >= 38)
      alerts.push({ level: 'urgent', message: `Febre (${evo.temperature}°C) — investigar foco infeccioso` });
    if (evo.spo2 && evo.spo2 < 92)
      alerts.push({ level: 'critical', message: `SpO2 ${evo.spo2}% — hipoxemia` });
    if (evo.diuresisMl != null && evo.diuresisMl < 30)
      alerts.push({ level: 'urgent', message: `Oliguria (${evo.diuresisMl}mL/h) — avaliar funcao renal` });
    evo.alerts = alerts.length > 0 ? alerts : null;
  }
}
