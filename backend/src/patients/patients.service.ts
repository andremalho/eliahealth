import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, QueryFailedError } from 'typeorm';
import { Patient } from './patient.entity.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly repo: Repository<Patient>,
  ) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    try {
      const patient = this.repo.create(dto);
      return await this.repo.save(patient);
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

  async findAll(): Promise<Patient[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.repo.findOneBy({ id });
    if (!patient) {
      throw new NotFoundException(`Paciente ${id} nao encontrado`);
    }
    return patient;
  }

  async search(query: string): Promise<Patient[]> {
    const normalized = query.replace(/[.\-]/g, '');

    return this.repo.find({
      where: [
        { fullName: ILike(`%${query}%`) },
        { cpf: ILike(`%${normalized}%`) },
      ],
      order: { fullName: 'ASC' },
    });
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
      Object.assign(patient, dto);
      return await this.repo.save(patient);
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
}
