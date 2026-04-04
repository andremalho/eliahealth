import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, QueryFailedError } from 'typeorm';
import { Patient } from './patient.entity.js';
import { BloodTypeRH, HEMOGLOBINOPATHY_RESULTS } from './patient.enums.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly repo: Repository<Patient>,
  ) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    try {
      this.computeBloodType(dto);
      const patient = this.repo.create(dto);
      const saved = await this.repo.save(patient);
      await this.checkHemoglobinopathy(saved);
      await this.checkRhNegative(saved);
      return saved;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        throw new ConflictException('CPF ou email ja cadastrado');
      }
      throw error;
    }
  }

  async findAll(tenantId: string | null, page = 1, limit = 50) {
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.repo.findOneBy({ id });
    if (!patient) {
      throw new NotFoundException(`Paciente ${id} nao encontrado`);
    }
    return patient;
  }

  async search(query: string, tenantId: string | null, page = 1, limit = 50) {
    const normalized = query.replace(/[.\-]/g, '');

    const where: Record<string, unknown>[] = [
      { fullName: ILike(`%${query}%`), ...(tenantId ? { tenantId } : {}) },
      { cpf: ILike(`%${normalized}%`), ...(tenantId ? { tenantId } : {}) },
    ];

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { fullName: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPortalAccessStats() {
    const total = await this.repo.count();
    const withAccess = await this.repo
      .createQueryBuilder('p')
      .where('p.email IS NOT NULL')
      .andWhere('p.lgpd_consent_at IS NOT NULL')
      .getCount();
    return {
      total,
      withAccess,
      percentage: total > 0 ? Math.round((withAccess / total) * 100) : 0,
    };
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);

    try {
      this.computeBloodType(dto);
      Object.assign(patient, dto);
      const saved = await this.repo.save(patient);
      await this.checkHemoglobinopathy(saved);
      await this.checkRhNegative(saved);
      return saved;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        throw new ConflictException('CPF ou email ja cadastrado');
      }
      throw error;
    }
  }

  private computeBloodType(dto: Partial<CreatePatientDto>): void {
    if (dto.bloodTypeABO != null && dto.bloodTypeRH != null) {
      const rhSign = dto.bloodTypeRH === BloodTypeRH.POSITIVE ? '+' : '-';
      dto.bloodType = `${dto.bloodTypeABO}${rhSign}`;
    }
  }

  private async checkRhNegative(patient: Patient): Promise<void> {
    if (patient.bloodTypeRH !== BloodTypeRH.NEGATIVE) return;

    const rhFlag = 'Rh negativo';

    // Add rh_negative to highRiskFlags of active pregnancies
    await this.repo.query(
      `UPDATE pregnancies
       SET high_risk_flags = (
         CASE
           WHEN NOT (high_risk_flags @> $1::jsonb)
           THEN high_risk_flags || $1::jsonb
           ELSE high_risk_flags
         END
       ),
       is_high_risk = true
       WHERE patient_id = $2 AND status = 'active'`,
      [JSON.stringify([rhFlag]), patient.id],
    );

    // Create pending Rhogam vaccine for each active pregnancy that doesn't have one
    await this.repo.query(
      `INSERT INTO vaccines (vaccine_name, vaccine_type, pregnancy_id, dose_number, status, total_doses_required, notes)
       SELECT
         'Rhogam (Imunoglobulina Anti-D)',
         'rhogam',
         p.id,
         1,
         'pending',
         1,
         'Gestante Rh negativo — administrar entre 28-34 semanas se Coombs indireto negativo. Dose: 300mcg IM. Fonte: FEBRASGO 2023'
       FROM pregnancies p
       WHERE p.patient_id = $1
         AND p.status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM vaccines v
           WHERE v.pregnancy_id = p.id AND v.vaccine_type = 'rhogam'
         )`,
      [patient.id],
    );

    this.logger.log(`Rh negativo detectado para paciente ${patient.id} — Rhogam criada`);
  }

  private async checkHemoglobinopathy(patient: Patient): Promise<void> {
    if (
      !patient.hemoglobinElectrophoresis ||
      !HEMOGLOBINOPATHY_RESULTS.has(patient.hemoglobinElectrophoresis)
    ) {
      return;
    }

    const alertFlag = 'Hemoglobinopatia identificada — acompanhamento especializado necessario';

    // Add flag to all active pregnancies of this patient
    await this.repo.query(
      `UPDATE pregnancies
       SET high_risk_flags = (
         CASE
           WHEN NOT (high_risk_flags @> $1::jsonb)
           THEN high_risk_flags || $1::jsonb
           ELSE high_risk_flags
         END
       ),
       is_high_risk = true
       WHERE patient_id = $2 AND status = 'active'`,
      [JSON.stringify([alertFlag]), patient.id],
    );

    this.logger.warn(
      `Hemoglobinopatia ${patient.hemoglobinElectrophoresis} para paciente ${patient.id}`,
    );
  }
}
