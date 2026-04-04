import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyContact } from './emergency-contact.entity.js';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto.js';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto.js';

@Injectable()
export class EmergencyContactsService {
  constructor(@InjectRepository(EmergencyContact) private readonly repo: Repository<EmergencyContact>) {}

  async create(patientId: string, dto: CreateEmergencyContactDto): Promise<EmergencyContact> {
    const contact = this.repo.create({ ...dto, patientId });
    return this.repo.save(contact);
  }

  async findAll(patientId: string, page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      where: { patientId },
      order: { isMainContact: 'DESC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<EmergencyContact> {
    const c = await this.repo.findOneBy({ id });
    if (!c) throw new NotFoundException(`Contato ${id} nao encontrado`);
    return c;
  }

  async update(id: string, dto: UpdateEmergencyContactDto): Promise<EmergencyContact> {
    const c = await this.findOne(id);
    Object.assign(c, dto);
    return this.repo.save(c);
  }

  async remove(id: string): Promise<void> {
    const c = await this.findOne(id);
    await this.repo.remove(c);
  }
}
