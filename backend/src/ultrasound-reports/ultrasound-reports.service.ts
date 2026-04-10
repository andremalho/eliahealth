import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { UltrasoundReport, ReportStatus } from './ultrasound-report.entity.js';

@Injectable()
export class UltrasoundReportsService {
  constructor(
    @InjectRepository(UltrasoundReport)
    private readonly repo: Repository<UltrasoundReport>,
  ) {}

  async create(dto: {
    patientId: string;
    pregnancyId?: string;
    doctorId: string;
    templateId: string;
    category: string;
    reportDate: string;
    data: Record<string, unknown>;
    conclusion?: string;
    tenantId?: string;
  }): Promise<UltrasoundReport> {
    const report = this.repo.create({
      ...dto,
      pregnancyId: dto.pregnancyId ?? null,
      tenantId: dto.tenantId ?? null,
      status: ReportStatus.DRAFT,
    });
    return this.repo.save(report);
  }

  async findByPatient(patientId: string) {
    return this.repo.find({
      where: { patientId },
      relations: ['doctor'],
      order: { reportDate: 'DESC' },
    });
  }

  async findByPregnancy(pregnancyId: string) {
    return this.repo.find({
      where: { pregnancyId },
      relations: ['doctor'],
      order: { reportDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UltrasoundReport> {
    const report = await this.repo.findOne({ where: { id }, relations: ['doctor', 'patient'] });
    if (!report) throw new NotFoundException('Laudo nao encontrado');
    return report;
  }

  async update(id: string, dto: Partial<{
    data: Record<string, unknown>;
    conclusion: string;
    images: { url: string; filename: string; order: number }[];
    reportDate: string;
  }>): Promise<UltrasoundReport> {
    const report = await this.findOne(id);
    if (report.status === ReportStatus.SIGNED || report.status === ReportStatus.EXPORTED) {
      throw new BadRequestException('Laudo assinado nao pode ser editado');
    }
    Object.assign(report, dto);
    return this.repo.save(report);
  }

  async sign(id: string, doctorName: string, doctorCrm: string): Promise<UltrasoundReport> {
    const report = await this.findOne(id);
    if (report.status === ReportStatus.SIGNED) {
      throw new BadRequestException('Laudo ja assinado');
    }

    const hashPayload = JSON.stringify({
      id: report.id,
      templateId: report.templateId,
      data: report.data,
      conclusion: report.conclusion,
      reportDate: report.reportDate,
      doctorName,
      doctorCrm,
      timestamp: new Date().toISOString(),
    });

    report.signatureHash = createHash('sha256').update(hashPayload).digest('hex');
    report.signedAt = new Date();
    report.signedByName = doctorName;
    report.signedByCrm = doctorCrm;
    report.status = ReportStatus.SIGNED;
    return this.repo.save(report);
  }

  async markExported(id: string, format: string): Promise<UltrasoundReport> {
    const report = await this.findOne(id);
    if (report.status !== ReportStatus.SIGNED) {
      throw new BadRequestException('Exportacao permitida apenas apos assinatura');
    }
    report.exportedAt = new Date();
    report.exportedFormat = format;
    report.status = ReportStatus.EXPORTED;
    return this.repo.save(report);
  }

  async markSent(id: string, via: string, to: string): Promise<UltrasoundReport> {
    const report = await this.findOne(id);
    if (report.status !== ReportStatus.SIGNED && report.status !== ReportStatus.EXPORTED) {
      throw new BadRequestException('Envio permitido apenas apos assinatura');
    }
    report.sentAt = new Date();
    report.sentVia = via;
    report.sentTo = to;
    return this.repo.save(report);
  }

  async delete(id: string): Promise<void> {
    const report = await this.findOne(id);
    if (report.status === ReportStatus.SIGNED || report.status === ReportStatus.EXPORTED) {
      throw new BadRequestException('Laudo assinado nao pode ser excluido');
    }
    await this.repo.remove(report);
  }
}
