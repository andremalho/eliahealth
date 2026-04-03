import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vaccine, VaccineType, VaccineStatus } from './vaccine.entity.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { CreateVaccineDto } from './dto/create-vaccine.dto.js';
import { UpdateVaccineDto } from './dto/update-vaccine.dto.js';

@Injectable()
export class VaccinesService {
  constructor(
    @InjectRepository(Vaccine) private readonly repo: Repository<Vaccine>,
    private readonly pregnanciesService: PregnanciesService,
  ) {}

  async create(pregnancyId: string, dto: CreateVaccineDto): Promise<Vaccine> {
    const vaccine = this.repo.create({ ...dto, pregnancyId });
    return this.repo.save(vaccine);
  }

  async findAll(pregnancyId: string): Promise<Vaccine[]> {
    return this.repo.find({ where: { pregnancyId }, order: { scheduledDate: 'ASC' } });
  }

  async findOne(id: string): Promise<Vaccine> {
    const v = await this.repo.findOneBy({ id });
    if (!v) throw new NotFoundException(`Vacina ${id} nao encontrada`);
    return v;
  }

  async update(id: string, dto: UpdateVaccineDto): Promise<Vaccine> {
    const v = await this.findOne(id);
    Object.assign(v, dto);
    return this.repo.save(v);
  }

  async findPending(pregnancyId: string): Promise<Vaccine[]> {
    return this.repo.find({
      where: [
        { pregnancyId, status: VaccineStatus.SCHEDULED },
        { pregnancyId, status: VaccineStatus.OVERDUE },
        { pregnancyId, status: VaccineStatus.PENDING },
      ],
      order: { scheduledDate: 'ASC' },
    });
  }

  async getVaccineCard(pregnancyId: string) {
    const pregnancy = await this.pregnanciesService.findOne(pregnancyId);
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);
    const vaccines = await this.findAll(pregnancyId);

    // Group by vaccine type
    const grouped = new Map<string, typeof vaccines>();
    for (const v of vaccines) {
      const key = v.vaccineType;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(v);
    }

    const card = Array.from(grouped.entries()).map(([type, doses]) => {
      doses.sort((a, b) => a.doseNumber - b.doseNumber);

      const allAdministered = doses.every(
        (d) => d.status === VaccineStatus.ADMINISTERED,
      );
      const hasPending = doses.some(
        (d) =>
          d.status === VaccineStatus.SCHEDULED ||
          d.status === VaccineStatus.PENDING ||
          d.status === VaccineStatus.OVERDUE,
      );

      return {
        vaccineType: type,
        vaccineName: doses[0].vaccineName,
        totalDoses: doses[0].totalDosesRequired ?? doses.length,
        doses: doses.map((d) => ({
          doseNumber: d.doseNumber,
          status: d.status,
          scheduledDate: d.scheduledDate,
          administeredDate: d.administeredDate,
          batchNumber: d.batchNumber,
        })),
        overallStatus: allAdministered
          ? 'complete'
          : hasPending
            ? 'pending'
            : 'not_applicable',
      };
    });

    // Build alerts for pending vaccines by GA
    const alerts: string[] = [];
    for (const v of vaccines) {
      if (
        v.status === VaccineStatus.SCHEDULED ||
        v.status === VaccineStatus.PENDING
      ) {
        alerts.push(
          `${v.vaccineName} (dose ${v.doseNumber}) — pendente`,
        );
      }
      if (v.status === VaccineStatus.OVERDUE) {
        alerts.push(
          `${v.vaccineName} (dose ${v.doseNumber}) — atrasada`,
        );
      }
    }

    return {
      pregnancyId,
      gestationalAge: { weeks: ga.weeks, days: ga.days },
      vaccines: card,
      alerts,
    };
  }

  async createRhogamForPregnancy(pregnancyId: string): Promise<Vaccine> {
    // Check if Rhogam already exists for this pregnancy
    const existing = await this.repo.findOneBy({
      pregnancyId,
      vaccineType: VaccineType.RHOGAM,
    });
    if (existing) return existing;

    const vaccine = this.repo.create({
      pregnancyId,
      vaccineName: 'Rhogam (Imunoglobulina Anti-D)',
      vaccineType: VaccineType.RHOGAM,
      doseNumber: 1,
      status: VaccineStatus.PENDING,
      totalDosesRequired: 1,
      notes:
        'Gestante Rh negativo — administrar entre 28-34 semanas se Coombs indireto negativo. Dose: 300mcg IM. Fonte: FEBRASGO 2023',
    });
    return this.repo.save(vaccine);
  }
}
