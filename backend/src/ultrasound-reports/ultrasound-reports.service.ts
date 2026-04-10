import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import PDFDocument from 'pdfkit';
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

  // ── PDF Generation ──

  async generatePdf(id: string): Promise<Buffer> {
    const report = await this.findOne(id);
    if (report.status !== ReportStatus.SIGNED && report.status !== ReportStatus.EXPORTED) {
      throw new BadRequestException('Exportacao PDF permitida apenas apos assinatura');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = 595.28 - 100; // A4 width minus margins

      // ── Header ──
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e1b4b')
        .text('eliahealth', { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
        .text('Prontuario exclusivo da mulher', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
      doc.moveDown(0.5);

      // ── Report title ──
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e1b4b')
        .text(`Laudo de Ultrassonografia`, { align: 'center' });
      doc.fontSize(11).font('Helvetica').fillColor('#374151')
        .text(report.templateId.replace(/_/g, ' ').toUpperCase(), { align: 'center' });
      doc.moveDown(0.3);

      // ── Patient info ──
      const patientName = report.patient?.fullName ?? '—';
      const reportDate = report.reportDate
        ? new Date(report.reportDate + 'T12:00:00').toLocaleDateString('pt-BR')
        : '—';
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151')
        .text(`Paciente: `, { continued: true }).font('Helvetica').text(patientName);
      doc.font('Helvetica-Bold').text(`Data do Exame: `, { continued: true }).font('Helvetica').text(reportDate);
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
      doc.moveDown(0.5);

      // ── Data fields ──
      const data = report.data as Record<string, unknown>;
      for (const [key, value] of Object.entries(data)) {
        if (!value || key.startsWith('_')) continue;
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        if (!strValue || strValue === '[]' || strValue === '{}') continue;

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#6b7280').text(label + ': ', { continued: true });
        doc.font('Helvetica').fillColor('#1f2937').text(strValue);
      }

      // ── Conclusion ──
      if (report.conclusion) {
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e1b4b').text('CONCLUSAO');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica').fillColor('#374151').text(report.conclusion);
      }

      // ── Images (2 columns x 3 rows per page) ──
      const images = report.images ?? [];
      if (images.length > 0) {
        doc.addPage();
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e1b4b').text('IMAGENS', { align: 'center' });
        doc.moveDown(0.5);

        const imgW = (pageW - 20) / 2; // 2 columns with 20px gap
        const imgH = 180; // 3 rows fit in A4
        let col = 0;
        let row = 0;
        const startY = doc.y;

        for (const img of images) {
          const imgPath = join(process.cwd(), img.url.startsWith('/') ? img.url.slice(1) : img.url);
          if (!existsSync(imgPath)) continue;

          const x = 50 + col * (imgW + 20);
          const y = startY + row * (imgH + 15);

          // New page if 3 rows filled
          if (row >= 3) {
            doc.addPage();
            row = 0;
            col = 0;
          }

          try {
            doc.image(imgPath, x, y, { fit: [imgW, imgH], align: 'center', valign: 'center' });
            doc.fontSize(7).fillColor('#9ca3af')
              .text(img.filename, x, y + imgH + 2, { width: imgW, align: 'center' });
          } catch {
            // Skip if image can't be loaded
          }

          col++;
          if (col >= 2) { col = 0; row++; }
        }
      }

      // ── Signature ──
      doc.addPage();
      doc.moveDown(3);
      doc.moveTo(180, doc.y).lineTo(415, doc.y).strokeColor('#374151').stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151')
        .text(report.signedByName ?? '', { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
        .text(`CRM: ${report.signedByCrm ?? ''}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#9ca3af')
        .text(`Assinado digitalmente em ${report.signedAt ? new Date(report.signedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}`, { align: 'center' });
      doc.fontSize(7).text(`Hash: ${report.signatureHash?.slice(0, 32)}...`, { align: 'center' });

      // ── Footer ──
      doc.moveDown(2);
      doc.fontSize(7).fillColor('#c4b5fd')
        .text('eliahealth — Prontuario exclusivo da mulher', { align: 'center' });
      doc.text('Documento gerado eletronicamente com validacao por assinatura digital', { align: 'center' });

      doc.end();
    });
  }
}
