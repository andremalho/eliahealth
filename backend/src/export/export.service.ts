import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import PDFDocument from 'pdfkit';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Pregnancy)
    private readonly pregnancyRepo: Repository<Pregnancy>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly pregnanciesService: PregnanciesService,
  ) {}

  // ── Text Export ──

  async exportText(pregnancyId: string, sections: string[]) {
    const pregnancy = await this.pregnancyRepo.findOne({
      where: { id: pregnancyId },
      relations: ['patient'],
    });
    if (!pregnancy) throw new NotFoundException('Gestacao nao encontrada');

    const patient = pregnancy.patient;
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);
    const lines: string[] = [];

    lines.push('=== PRONTUARIO OBSTETRICO — EliaHealth ===');
    lines.push(`Gerado em: ${new Date().toISOString()}`);
    lines.push('');

    if (sections.includes('patient_data')) {
      lines.push('--- DADOS DA PACIENTE ---');
      lines.push(`Nome: ${patient.fullName}`);
      lines.push(`Data de nascimento: ${patient.dateOfBirth ?? 'N/I'}`);
      lines.push(`Tipo sanguineo: ${patient.bloodType ?? 'N/I'}`);
      lines.push(`Telefone: ${patient.phone ?? 'N/I'}`);
      lines.push(`Email: ${patient.email ?? 'N/I'}`);
      lines.push('');
    }

    if (sections.includes('obstetric_history')) {
      lines.push('--- HISTORICO OBSTETRICO ---');
      lines.push(`G${pregnancy.gravida} P${pregnancy.para} A${pregnancy.abortus}`);
      lines.push(`Cesareas: ${pregnancy.cesareans ?? 0} | Partos normais: ${pregnancy.vaginalDeliveries ?? 0}`);
      lines.push('');
    }

    if (sections.includes('pathologies')) {
      lines.push('--- PATOLOGIAS / COMORBIDADES ---');
      lines.push(`Comorbidades: ${patient.comorbidities ?? 'Nenhuma'}`);
      lines.push(`Alergias: ${patient.allergies ?? 'Nenhuma'}`);
      lines.push(`Vicios: ${patient.addictions ?? 'Nenhum'}`);
      lines.push(`Cirurgias: ${patient.surgeries ?? 'Nenhuma'}`);
      lines.push('');
    }

    if (sections.includes('clinical_history')) {
      lines.push('--- DADOS DA GESTACAO ---');
      lines.push(`IG: ${ga.weeks}s ${ga.days}d`);
      lines.push(`DPP: ${pregnancy.edd}`);
      lines.push(`DUM: ${pregnancy.lmpDate}`);
      lines.push(`Metodo: ${pregnancy.gaMethod}`);
      lines.push(`Alto risco: ${pregnancy.isHighRisk ? 'Sim' : 'Nao'}`);
      if (pregnancy.highRiskFlags.length > 0) {
        lines.push(`Fatores: ${pregnancy.highRiskFlags.join(', ')}`);
      }
      lines.push('');
    }

    const sectionQueries: Record<string, string> = {
      last_consultation: `SELECT date, bp_systolic, bp_diastolic, weight_kg, fundal_height_cm, fetal_heart_rate, subjective, assessment, plan FROM consultations WHERE pregnancy_id = $1 ORDER BY date DESC LIMIT 1`,
      all_consultations: `SELECT date, bp_systolic, bp_diastolic, weight_kg, fundal_height_cm, subjective, assessment FROM consultations WHERE pregnancy_id = $1 ORDER BY date ASC`,
      exams: `SELECT exam_name, exam_category, value, unit, result_text, status, result_date FROM lab_results WHERE pregnancy_id = $1 ORDER BY result_date DESC`,
      glucose_30days: `SELECT reading_date, reading_time, measurement_type, glucose_value, status FROM glucose_readings WHERE pregnancy_id = $1 AND reading_date >= CURRENT_DATE - 30 ORDER BY reading_date DESC, reading_time DESC`,
      last_ultrasound: `SELECT exam_type, exam_date, general_observations, alert_message FROM ultrasound_summaries WHERE pregnancy_id = $1 ORDER BY exam_date DESC LIMIT 1`,
      all_ultrasounds: `SELECT exam_type, exam_date, general_observations FROM ultrasound_summaries WHERE pregnancy_id = $1 ORDER BY exam_date ASC`,
      vaccines: `SELECT vaccine_name, status, administered_date, dose_number FROM vaccines WHERE pregnancy_id = $1 ORDER BY vaccine_name ASC`,
      vaginal_swabs: `SELECT exam_type, collection_date, result, status FROM vaginal_swabs WHERE pregnancy_id = $1 ORDER BY collection_date DESC`,
      prescriptions: `SELECT prescription_date, medications, status, notes FROM prescriptions WHERE pregnancy_id = $1 ORDER BY prescription_date DESC`,
    };

    for (const [section, query] of Object.entries(sectionQueries)) {
      if (!sections.includes(section)) continue;
      const rows = await this.pregnancyRepo.query(query, [pregnancyId]);
      lines.push(`--- ${section.toUpperCase().replace(/_/g, ' ')} ---`);
      if (rows.length === 0) {
        lines.push('Nenhum registro');
      } else {
        for (const row of rows) {
          lines.push(JSON.stringify(row, null, 2));
        }
      }
      lines.push('');
    }

    return { text: lines.join('\n'), generatedAt: new Date().toISOString() };
  }

  // ── QR Code Share ──

  async generateShareQrCode(pregnancyId: string) {
    await this.pregnanciesService.findOne(pregnancyId);

    const accessToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store token in pregnancy_shares or a dedicated table — for now return the URL
    const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `https://app.eliahealth.com/cartao?token=${accessToken}`,
    )}`;

    return { qrcodeUrl, accessToken, expiresAt };
  }

  // ── PDF Card ──
  // For white-label: replace logo and colors from tenant config

  async generatePdfCard(pregnancyId: string): Promise<Buffer> {
    const pregnancy = await this.pregnancyRepo.findOne({
      where: { id: pregnancyId },
      relations: ['patient'],
    });
    if (!pregnancy) throw new NotFoundException('Gestação não encontrada');

    const patient = pregnancy.patient;
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);

    const [vaccines, alerts, lastConsultation, recentConsultations, ultrasounds, labs] = await Promise.all([
      this.pregnancyRepo.query(
        `SELECT vaccine_name, status, administered_date, dose_number FROM vaccines WHERE pregnancy_id = $1 ORDER BY administered_date DESC NULLS LAST`,
        [pregnancyId],
      ),
      this.pregnancyRepo.query(
        `SELECT title, message, severity FROM copilot_alerts WHERE pregnancy_id = $1 AND is_read = false ORDER BY created_at DESC LIMIT 6`,
        [pregnancyId],
      ).catch(() => []),
      this.pregnancyRepo.query(
        `SELECT date, bp_systolic, bp_diastolic, weight_kg, fetal_heart_rate, fundal_height_cm FROM consultations WHERE pregnancy_id = $1 ORDER BY date DESC LIMIT 1`,
        [pregnancyId],
      ),
      this.pregnancyRepo.query(
        `SELECT date, bp_systolic, bp_diastolic, weight_kg, fetal_heart_rate, fundal_height_cm, gestational_age_days FROM consultations WHERE pregnancy_id = $1 ORDER BY date DESC LIMIT 6`,
        [pregnancyId],
      ),
      this.pregnancyRepo.query(
        `SELECT exam_type, exam_date, final_report FROM ultrasounds WHERE pregnancy_id = $1 ORDER BY exam_date DESC LIMIT 4`,
        [pregnancyId],
      ).catch(() => []),
      this.pregnancyRepo.query(
        `SELECT exam_name, value, unit, reference_min, reference_max, status, result_date FROM lab_results WHERE pregnancy_id = $1 ORDER BY result_date DESC NULLS LAST LIMIT 8`,
        [pregnancyId],
      ).catch(() => []),
    ]);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        info: {
          Title: `Cartão da Gestante - ${patient.fullName}`,
          Author: 'EliaHealth',
        },
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Helpers ──
      const PAGE_WIDTH = doc.page.width - 80;
      const LILAC = '#7C5CBF';
      const NAVY = '#0F1F3D';
      const GRAY = '#6b7280';
      const LIGHT = '#f3f4f6';
      const RED = '#dc2626';
      const AMBER = '#d97706';

      const fmtDate = (d: any): string => {
        if (!d) return '—';
        try {
          const date = typeof d === 'string' ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')) : new Date(d);
          return date.toLocaleDateString('pt-BR');
        } catch { return '—'; }
      };

      const fmtAge = (dob: any): string => {
        if (!dob) return '—';
        const years = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
        return `${years} anos`;
      };

      const sectionTitle = (title: string, color: string = LILAC) => {
        if (doc.y > doc.page.height - 120) doc.addPage();
        doc.moveDown(0.9);
        doc.fontSize(11).fillColor(color).font('Helvetica-Bold').text(title.toUpperCase(), { characterSpacing: 0.5 });
        doc
          .moveTo(40, doc.y + 2)
          .lineTo(40 + PAGE_WIDTH, doc.y + 2)
          .strokeColor(color)
          .lineWidth(0.8)
          .stroke();
        doc.moveDown(0.7);
        doc.fontSize(9).fillColor(NAVY).font('Helvetica');
      };

      const kvRow = (pairs: [string, string][]) => {
        const startY = doc.y;
        const colWidth = PAGE_WIDTH / pairs.length;
        pairs.forEach(([label, value], i) => {
          const x = 40 + i * colWidth;
          doc.fontSize(7).fillColor(GRAY).font('Helvetica').text(label.toUpperCase(), x, startY, { width: colWidth - 8 });
          doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold').text(value || '—', x, startY + 11, { width: colWidth - 8 });
        });
        doc.y = startY + 30;
        doc.x = 40;
      };

      const drawTable = (
        headers: string[],
        rows: string[][],
        widths: number[],
      ) => {
        const startX = 40;
        let y = doc.y;
        const rowHeight = 18;
        const headerHeight = 20;

        // Verificar se cabe na página
        const totalHeight = headerHeight + rowHeight * rows.length;
        if (y + totalHeight > doc.page.height - 60) {
          doc.addPage();
          y = doc.y;
        }

        const tableTopY = y;
        // Header
        doc.rect(startX, y, PAGE_WIDTH, headerHeight).fill(LILAC);
        let xCursor = startX;
        headers.forEach((h, i) => {
          doc.fillColor('white').fontSize(8).font('Helvetica-Bold').text(h, xCursor + 5, y + 6, { width: widths[i] - 10 });
          xCursor += widths[i];
        });
        y += headerHeight;

        // Rows
        rows.forEach((row, ri) => {
          if (ri % 2 === 0) doc.rect(startX, y, PAGE_WIDTH, rowHeight).fill(LIGHT);
          xCursor = startX;
          row.forEach((cell, i) => {
            doc.fillColor(NAVY).fontSize(8).font('Helvetica').text(cell || '—', xCursor + 5, y + 5, {
              width: widths[i] - 10,
              ellipsis: true,
              lineBreak: false,
            });
            xCursor += widths[i];
          });
          y += rowHeight;
        });

        // Border (use coordenada superior salva, nao doc.y atual)
        doc.rect(startX, tableTopY, PAGE_WIDTH, headerHeight + rowHeight * rows.length).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        doc.y = y + 8;
        doc.x = 40;
      };

      // ── HEADER ──
      doc.rect(0, 0, doc.page.width, 70).fill(NAVY);
      doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('eliahealth', 40, 22);
      doc.fillColor('#a78bfa').fontSize(11).font('Helvetica').text('Cartão da Gestante', 40, 48);
      doc.fillColor('#9ca3af').fontSize(8).text(
        `Gerado em ${new Date().toLocaleString('pt-BR')}`,
        doc.page.width - 200,
        50,
        { width: 160, align: 'right' },
      );

      doc.y = 90;
      doc.x = 40;

      // ── PACIENTE ──
      sectionTitle('Identificação da paciente');
      doc.fontSize(13).fillColor(NAVY).font('Helvetica-Bold').text(patient.fullName);
      doc.moveDown(0.3);
      kvRow([
        ['CPF', patient.cpf || '—'],
        ['Idade', fmtAge(patient.dateOfBirth)],
        ['Tipo sanguíneo', patient.bloodType || '—'],
      ]);
      kvRow([
        ['E-mail', patient.email || '—'],
        ['Telefone', patient.phone || '—'],
      ]);

      // ── GESTAÇÃO ──
      sectionTitle('Dados da gestação');
      kvRow([
        ['IG atual', `${ga.weeks}s ${ga.days}d`],
        ['DPP', fmtDate(pregnancy.edd)],
        ['DUM', fmtDate(pregnancy.lmpDate)],
        ['Método', pregnancy.gaMethod === 'ultrasound' ? 'USG' : pregnancy.gaMethod === 'ivf' ? 'FIV' : 'DUM'],
      ]);
      kvRow([
        ['Gestações (G)', String(pregnancy.gravida ?? 0)],
        ['Partos (P)', String(pregnancy.para ?? 0)],
        ['Abortos (A)', String(pregnancy.abortus ?? 0)],
        ['PV / PC / PF', `${pregnancy.vaginalDeliveries ?? 0} / ${pregnancy.cesareans ?? 0} / ${(pregnancy as any).forcepsDeliveries ?? 0}`],
      ]);

      // Risco
      if (pregnancy.isHighRisk) {
        doc.moveDown(0.5);
        const flags = (pregnancy.highRiskFlags ?? []).join(', ');
        const bannerY = doc.y;
        const bannerH = flags ? 36 : 22;
        doc.rect(40, bannerY, PAGE_WIDTH, bannerH).fill('#fef2f2').strokeColor(RED).lineWidth(0.6).stroke();
        doc.fillColor(RED).fontSize(9).font('Helvetica-Bold').text('GESTAÇÃO DE ALTO RISCO', 48, bannerY + 6, { width: PAGE_WIDTH - 16 });
        if (flags) {
          doc.fillColor(NAVY).fontSize(8).font('Helvetica').text(flags, 48, bannerY + 20, { width: PAGE_WIDTH - 16 });
        }
        doc.y = bannerY + bannerH + 6;
        doc.x = 40;
      }

      // ── ANTECEDENTES / COMORBIDADES ──
      const comorbs: string[] = (patient as any).comorbiditiesSelected ?? [];
      const addicts: string[] = (patient as any).addictionsSelected ?? [];
      const renderBlock = (label: string, content: string, labelColor: string = GRAY, bold: boolean = false) => {
        doc.fontSize(7).fillColor(labelColor).font(bold ? 'Helvetica-Bold' : 'Helvetica').text(label.toUpperCase(), 40, doc.y, { width: PAGE_WIDTH });
        doc.moveDown(0.15);
        doc.fontSize(9).fillColor(NAVY).font('Helvetica').text(content, 40, doc.y, { width: PAGE_WIDTH });
        doc.moveDown(0.6);
      };
      if (comorbs.length || patient.allergies || addicts.length || (pregnancy as any).currentPathologies || (pregnancy as any).currentMedications) {
        sectionTitle('Antecedentes pessoais');
        if (comorbs.length) renderBlock('Comorbidades', comorbs.join(' • '));
        if ((pregnancy as any).currentPathologies) renderBlock('Patologias da gestação atual', (pregnancy as any).currentPathologies);
        if (addicts.length) renderBlock('Hábitos', addicts.join(' • '));
        if (patient.allergies) renderBlock('Alergias', patient.allergies, AMBER, true);
        if ((pregnancy as any).currentMedications) renderBlock('Medicações em uso', (pregnancy as any).currentMedications);
      }

      // ── CONSULTAS RECENTES ──
      if (recentConsultations.length > 0) {
        sectionTitle('Consultas recentes');
        const rows = recentConsultations.map((c: any) => {
          const days = c.gestational_age_days ?? 0;
          const ig = `${Math.floor(days / 7)}s ${days % 7}d`;
          const pa = c.bp_systolic && c.bp_diastolic ? `${c.bp_systolic}/${c.bp_diastolic}` : '—';
          return [
            ig,
            fmtDate(c.date),
            c.weight_kg != null ? `${c.weight_kg}` : '—',
            pa,
            c.fetal_heart_rate ? String(c.fetal_heart_rate) : '—',
            c.fundal_height_cm != null ? `${c.fundal_height_cm}` : '—',
          ];
        });
        drawTable(
          ['IG', 'Data', 'Peso (kg)', 'PA (mmHg)', 'BCF', 'AU (cm)'],
          rows,
          [60, 75, 75, 90, 60, 70],
        );
      }

      // ── ULTRASSONS ──
      if (ultrasounds.length > 0) {
        sectionTitle('Ultrassonografias');
        const rows = ultrasounds.map((u: any) => [
          u.exam_type ?? '—',
          fmtDate(u.exam_date),
          (u.final_report ?? '—').replace(/\n/g, ' ').slice(0, 80),
        ]);
        drawTable(['Tipo', 'Data', 'Achados'], rows, [120, 75, 235]);
      }

      // ── EXAMES LABORATORIAIS ──
      if (labs.length > 0) {
        sectionTitle('Exames laboratoriais recentes');
        const rows = labs.map((l: any) => {
          const ref = l.reference_min != null && l.reference_max != null ? `${l.reference_min}–${l.reference_max}` : '—';
          return [
            l.exam_name ?? '—',
            l.value != null ? `${l.value}${l.unit ? ' ' + l.unit : ''}` : '—',
            ref,
            l.status ?? '—',
            fmtDate(l.result_date),
          ];
        });
        drawTable(['Exame', 'Resultado', 'Referência', 'Status', 'Data'], rows, [140, 80, 80, 70, 60]);
      }

      // ── VACINAS ──
      if (vaccines.length > 0) {
        sectionTitle('Vacinas');
        const rows = vaccines.map((v: any) => [
          v.vaccine_name ?? '—',
          v.dose_number ? `${v.dose_number}ª` : '—',
          v.status ?? '—',
          fmtDate(v.administered_date),
        ]);
        drawTable(['Vacina', 'Dose', 'Status', 'Data'], rows, [200, 50, 100, 80]);
      }

      // ── ALERTAS ──
      if (alerts.length > 0) {
        sectionTitle('Alertas ativos do copiloto', RED);
        for (const a of alerts) {
          const dotColor = a.severity === 'critical' ? RED : a.severity === 'urgent' ? RED : a.severity === 'warning' ? AMBER : GRAY;
          doc.circle(45, doc.y + 5, 2).fill(dotColor);
          doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text(a.title ?? 'Alerta', 52, doc.y, { width: PAGE_WIDTH - 12 });
          if (a.message) {
            doc.fontSize(8).fillColor(GRAY).font('Helvetica').text(a.message, 52, doc.y, { width: PAGE_WIDTH - 12 });
          }
          doc.moveDown(0.4);
        }
      }

      // ── FOOTER ──
      const footerY = doc.page.height - 30;
      doc
        .moveTo(40, footerY - 5)
        .lineTo(doc.page.width - 40, footerY - 5)
        .strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .stroke();
      doc.fontSize(7).fillColor(GRAY).font('Helvetica').text(
        'Documento gerado eletronicamente por EliaHealth — Prontuário pré-natal inteligente',
        40,
        footerY,
        { width: PAGE_WIDTH, align: 'center' },
      );

      doc.end();
    });
  }

  // ── Guest Share ──

  async shareWithGuest(
    pregnancyId: string,
    sharedBy: string,
    guest: { name: string; email: string; accessLevel: string; expiresAt: string },
  ) {
    await this.pregnanciesService.findOne(pregnancyId);

    const accessToken = randomBytes(32).toString('hex');

    // Store guest share with token — no userId needed for external guests
    await this.pregnancyRepo.query(
      `INSERT INTO guest_shares (pregnancy_id, shared_by, guest_name, guest_email, access_token, permission, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [pregnancyId, sharedBy, guest.name, guest.email, accessToken, guest.accessLevel, guest.expiresAt],
    );

    return {
      guestName: guest.name,
      guestEmail: guest.email,
      accessToken,
      accessLevel: guest.accessLevel,
      expiresAt: guest.expiresAt,
      shareLink: `https://app.eliahealth.com/guest?token=${accessToken}`,
    };
  }
}
