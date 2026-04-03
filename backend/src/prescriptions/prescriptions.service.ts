import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription, PrescriptionStatus } from './prescription.entity.js';
import { CreatePrescriptionDto } from './dto/create-prescription.dto.js';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto.js';

@Injectable()
export class PrescriptionsService {
  constructor(@InjectRepository(Prescription) private readonly repo: Repository<Prescription>) {}

  async create(pregnancyId: string, prescribedBy: string, dto: CreatePrescriptionDto): Promise<Prescription> {
    const rx = this.repo.create({ ...dto, pregnancyId, prescribedBy });
    return this.repo.save(rx);
  }

  async findAll(pregnancyId: string): Promise<Prescription[]> {
    return this.repo.find({ where: { pregnancyId }, order: { prescriptionDate: 'DESC' } });
  }

  async findOne(id: string): Promise<Prescription> {
    const rx = await this.repo.findOneBy({ id });
    if (!rx) throw new NotFoundException(`Prescricao ${id} nao encontrada`);
    return rx;
  }

  async update(id: string, dto: UpdatePrescriptionDto): Promise<Prescription> {
    const rx = await this.findOne(id);
    Object.assign(rx, dto);
    return this.repo.save(rx);
  }

  async findActive(pregnancyId: string): Promise<Prescription[]> {
    return this.repo.find({
      where: { pregnancyId, status: PrescriptionStatus.ACTIVE },
      order: { prescriptionDate: 'DESC' },
    });
  }
}
