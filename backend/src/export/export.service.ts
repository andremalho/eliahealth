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
    if (!pregnancy) throw new NotFoundException('Gestacao nao encontrada');

    const patient = pregnancy.patient;
    const ga = this.pregnanciesService.getGestationalAge(pregnancy);

    const [vaccines, alerts, lastConsultation] = await Promise.all([
      this.pregnancyRepo.query(
        `SELECT vaccine_name, status FROM vaccines WHERE pregnancy_id = $1`,
        [pregnancyId],
      ),
      this.pregnancyRepo.query(
        `SELECT alert_message FROM lab_results WHERE pregnancy_id = $1 AND alert_triggered = true
         UNION ALL
         SELECT alert_message FROM copilot_alerts WHERE pregnancy_id = $1 AND is_read = false LIMIT 5`,
        [pregnancyId],
      ).catch(() => []),
      this.pregnancyRepo.query(
        `SELECT date, bp_systolic, bp_diastolic, weight_kg FROM consultations WHERE pregnancy_id = $1 ORDER BY date DESC LIMIT 1`,
        [pregnancyId],
      ),
    ]);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).fillColor('#7c3aed').text('EliaHealth', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor('#1f2937').text('Cartao da Gestante', { align: 'center' });
      doc.moveDown();

      // Patient info
      doc.fontSize(11).fillColor('#374151');
      doc.text(`Paciente: ${patient.fullName}`);
      doc.text(`Email: ${patient.email ?? 'N/I'} | Telefone: ${patient.phone ?? 'N/I'}`);
      if (patient.dateOfBirth) {
        const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000);
        doc.text(`Idade: ${age} anos`);
      }
      doc.moveDown();

      // Pregnancy info
      doc.fontSize(12).fillColor('#7c3aed').text('Dados da Gestacao');
      doc.fontSize(10).fillColor('#374151');
      doc.text(`IG: ${ga.weeks} semanas e ${ga.days} dias`);
      doc.text(`DPP: ${pregnancy.edd} | DUM: ${pregnancy.lmpDate}`);
      doc.text(`G${pregnancy.gravida} P${pregnancy.para} A${pregnancy.abortus} | Cesareas: ${pregnancy.cesareans ?? 0} | Partos normais: ${pregnancy.vaginalDeliveries ?? 0}`);
      doc.text(`Alto risco: ${pregnancy.isHighRisk ? 'Sim — ' + pregnancy.highRiskFlags.join(', ') : 'Nao'}`);
      doc.text(`Tipo sanguineo: ${patient.bloodType ?? 'N/I'}`);
      doc.moveDown();

      // Last consultation
      if (lastConsultation.length > 0) {
        const lc = lastConsultation[0];
        doc.fontSize(12).fillColor('#7c3aed').text('Ultima Consulta');
        doc.fontSize(10).fillColor('#374151');
        doc.text(`Data: ${lc.date} | PA: ${lc.bp_systolic ?? '-'}/${lc.bp_diastolic ?? '-'} mmHg | Peso: ${lc.weight_kg ?? '-'} kg`);
        doc.moveDown();
      }

      // Vaccines
      if (vaccines.length > 0) {
        doc.fontSize(12).fillColor('#7c3aed').text('Vacinas');
        doc.fontSize(10).fillColor('#374151');
        for (const v of vaccines) {
          doc.text(`${v.vaccine_name}: ${v.status}`);
        }
        doc.moveDown();
      }

      // Alerts
      if (alerts.length > 0) {
        doc.fontSize(12).fillColor('#dc2626').text('Alertas Ativos');
        doc.fontSize(10).fillColor('#374151');
        for (const a of alerts) {
          if (a.alert_message) doc.text(`• ${a.alert_message}`);
        }
        doc.moveDown();
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#9ca3af').text(
        `Gerado em ${new Date().toLocaleString('pt-BR')} | Powered by EliaHealth`,
        { align: 'center' },
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
