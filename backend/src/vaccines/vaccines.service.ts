import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vaccine, VaccineStatus } from './vaccine.entity.js';
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
      ],
      order: { scheduledDate: 'ASC' },
    });
  }
}
