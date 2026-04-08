import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription, PrescriptionStatus, DigitalSignatureProvider } from './prescription.entity.js';
import { verifySubResourceTenant } from '../common/tenant.js';
import { CreatePrescriptionDto } from './dto/create-prescription.dto.js';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto.js';

@Injectable()
export class PrescriptionsService {
  constructor(@InjectRepository(Prescription) private readonly repo: Repository<Prescription>) {}

  async create(pregnancyId: string, prescribedBy: string, dto: CreatePrescriptionDto): Promise<Prescription> {
    const rx = this.repo.create({ ...dto, pregnancyId, prescribedBy });
    return this.repo.save(rx);
  }

  async findAll(pregnancyId: string, page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      where: { pregnancyId },
      order: { prescriptionDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId?: string | null): Promise<Prescription> {
    const rx = await this.repo.findOneBy({ id });
    if (!rx) throw new NotFoundException(`Prescricao ${id} nao encontrada`);
    await verifySubResourceTenant(this.repo, 'prescriptions', id, tenantId ?? null);
    return rx;
  }

  async update(id: string, dto: UpdatePrescriptionDto, tenantId?: string | null): Promise<Prescription> {
    const rx = await this.findOne(id, tenantId);
    Object.assign(rx, dto);
    return this.repo.save(rx);
  }

  async remove(id: string, tenantId?: string | null): Promise<void> {
    const rx = await this.findOne(id, tenantId);
    await this.repo.remove(rx);
  }

  async findActive(pregnancyId: string): Promise<Prescription[]> {
    return this.repo.find({
      where: { pregnancyId, status: PrescriptionStatus.ACTIVE },
      order: { prescriptionDate: 'DESC' },
    });
  }

  async sign(id: string, provider: string, signatureToken: string) {
    const rx = await this.findOne(id);

    rx.digitalSignatureId = signatureToken;
    rx.digitalSignatureProvider = provider as DigitalSignatureProvider;
    rx.signedAt = new Date();
    // In production, call the provider API to generate the signed PDF URL
    rx.signedDocumentUrl = `https://api.eliahealth.com/signed/${id}.pdf`;

    return this.repo.save(rx);
  }

  // Implement real Memed API call when integration is activated
  async generateMemedToken(prescribedBy: string) {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    return {
      token: `memed_tmp_${prescribedBy}_${Date.now()}`,
      expiresAt,
    };
  }
}
