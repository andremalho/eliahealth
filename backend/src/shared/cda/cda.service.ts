import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { create } from 'xmlbuilder2';
import { Pregnancy } from '../../pregnancies/pregnancy.entity.js';

@Injectable()
export class CdaService {
  constructor(
    @InjectRepository(Pregnancy) private readonly pregnancyRepo: Repository<Pregnancy>,
  ) {}

  async generateRAC(pregnancyId: string): Promise<string> {
    const data = await this.loadPregnancyData(pregnancyId);

    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('ClinicalDocument', { xmlns: 'urn:hl7-org:v3' })
        .ele('typeId', { root: '2.16.840.1.113883.1.3', extension: 'POCD_HD000040' }).up()
        .ele('templateId', { root: '2.16.840.1.113883.10.20.1' }).up()
        .ele('id', { root: pregnancyId }).up()
        .ele('code', { code: 'RAC', codeSystem: '2.16.840.1.113883.6.1', displayName: 'Registro de Atendimento Clinico' }).up()
        .ele('effectiveTime', { value: new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14) }).up()
        .ele('recordTarget')
          .ele('patientRole')
            .ele('id', { extension: data.patient.cpf, root: '2.16.840.1.113883.13.236' }).up()
            .ele('patient')
              .ele('name').ele('given').txt(data.patient.fullName.split(' ')[0]).up().ele('family').txt(data.patient.fullName.split(' ').pop()!).up().up()
              .ele('birthTime', { value: (data.patient.dateOfBirth ?? '').replace(/-/g, '') }).up()
            .up()
          .up()
        .up()
        .ele('component')
          .ele('structuredBody');

    // Vital signs section
    if (data.lastConsultation) {
      const lc = data.lastConsultation;
      doc.ele('component').ele('section')
        .ele('title').txt('Sinais Vitais').up()
        .ele('text')
          .ele('paragraph').txt(`Data: ${lc.date}`).up()
          .ele('paragraph').txt(`Peso: ${lc.weight_kg ?? '-'} kg`).up()
          .ele('paragraph').txt(`PA: ${lc.bp_systolic ?? '-'}/${lc.bp_diastolic ?? '-'} mmHg`).up()
          .ele('paragraph').txt(`BCF: ${lc.fetal_heart_rate ?? '-'} bpm`).up()
        .up()
      .up().up();
    }

    // Plan section
    if (data.lastConsultation?.plan) {
      doc.ele('component').ele('section')
        .ele('title').txt('Plano e Conduta').up()
        .ele('text').ele('paragraph').txt(data.lastConsultation.plan).up().up()
      .up().up();
    }

    return doc.up().up().end({ prettyPrint: true });
  }

  async generateSumarioAlta(pregnancyId: string): Promise<string> {
    const data = await this.loadPregnancyData(pregnancyId);

    const [outcome] = await this.pregnancyRepo.query(
      `SELECT * FROM pregnancy_outcomes WHERE pregnancy_id = $1`,
      [pregnancyId],
    );

    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('ClinicalDocument', { xmlns: 'urn:hl7-org:v3' })
        .ele('templateId', { root: '2.16.840.1.113883.10.20.22.1.8' }).up()
        .ele('code', { code: '18842-5', codeSystem: '2.16.840.1.113883.6.1', displayName: 'Sumario de Alta' }).up()
        .ele('effectiveTime', { value: new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14) }).up()
        .ele('component')
          .ele('structuredBody')
            .ele('component').ele('section')
              .ele('title').txt('Dados da Gestacao').up()
              .ele('text')
                .ele('paragraph').txt(`G${data.pregnancy.gravida} P${data.pregnancy.para} A${data.pregnancy.abortus}`).up()
                .ele('paragraph').txt(`DPP: ${data.pregnancy.edd}`).up()
                .ele('paragraph').txt(`Tipo de parto: ${outcome?.delivery_type ?? 'N/I'}`).up()
                .ele('paragraph').txt(`Data do parto: ${outcome?.delivery_date ?? 'N/I'}`).up()
              .up()
            .up().up();

    if (outcome?.neonatal_data) {
      doc.ele('component').ele('section')
        .ele('title').txt('Dados do Recem-Nascido').up()
        .ele('text').ele('paragraph').txt(JSON.stringify(outcome.neonatal_data)).up().up()
      .up().up();
    }

    return doc.up().up().up().end({ prettyPrint: true });
  }

  async generateResultadoExame(labResultId: string): Promise<string> {
    const [result] = await this.pregnancyRepo.query(
      `SELECT lr.*, p.full_name, p.cpf, p.date_of_birth
       FROM lab_results lr JOIN pregnancies preg ON preg.id = lr.pregnancy_id
       JOIN patients p ON p.id = preg.patient_id
       WHERE lr.id = $1`,
      [labResultId],
    );
    if (!result) throw new NotFoundException('Exame nao encontrado');

    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('ClinicalDocument', { xmlns: 'urn:hl7-org:v3' })
        .ele('code', { code: '11502-2', codeSystem: '2.16.840.1.113883.6.1', displayName: 'Resultado de Exame' }).up()
        .ele('effectiveTime', { value: new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14) }).up()
        .ele('recordTarget').ele('patientRole')
          .ele('id', { extension: result.cpf, root: '2.16.840.1.113883.13.236' }).up()
        .up().up()
        .ele('component').ele('structuredBody')
          .ele('component').ele('section')
            .ele('title').txt('Resultado').up()
            .ele('entry').ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
              .ele('code', { code: result.exam_name, displayName: result.exam_name }).up()
              .ele('value', { value: result.value ?? '', unit: result.unit ?? '' }).up()
              .ele('referenceRange').ele('observationRange')
                .ele('text').txt(`${result.reference_min ?? ''} - ${result.reference_max ?? ''}`).up()
              .up().up()
              .ele('interpretationCode', { code: result.status === 'normal' ? 'N' : 'A' }).up()
            .up().up()
          .up().up()
        .up().up()
      .up();

    return doc.end({ prettyPrint: true });
  }

  private async loadPregnancyData(pregnancyId: string) {
    const [row] = await this.pregnancyRepo.query(
      `SELECT preg.*, p.full_name, p.cpf, p.date_of_birth, p.phone, p.email
       FROM pregnancies preg JOIN patients p ON p.id = preg.patient_id
       WHERE preg.id = $1`,
      [pregnancyId],
    );
    if (!row) throw new NotFoundException('Gestacao nao encontrada');

    const [lastConsultation] = await this.pregnancyRepo.query(
      `SELECT * FROM consultations WHERE pregnancy_id = $1 ORDER BY date DESC LIMIT 1`,
      [pregnancyId],
    );

    return {
      pregnancy: row,
      patient: { fullName: row.full_name, cpf: row.cpf, dateOfBirth: row.date_of_birth },
      lastConsultation: lastConsultation ?? null,
    };
  }
}
