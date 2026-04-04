import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LgpdConsent, ConsentType } from './lgpd-consent.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class LgpdService {
  constructor(
    @InjectRepository(LgpdConsent) private readonly consentRepo: Repository<LgpdConsent>,
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    private readonly auditService: AuditService,
  ) {}

  async getConsents(patientId: string) {
    return this.consentRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async registerConsent(
    patientId: string,
    data: { consentType: ConsentType; granted: boolean; ipAddress: string; version: string; termText: string },
  ) {
    const consent = this.consentRepo.create({
      patientId,
      consentType: data.consentType,
      granted: data.granted,
      grantedAt: data.granted ? new Date() : null,
      revokedAt: data.granted ? null : new Date(),
      ipAddress: data.ipAddress,
      version: data.version,
      termText: data.termText,
    });
    return this.consentRepo.save(consent);
  }

  async exportMyData(patientId: string) {
    const patient = await this.patientRepo.findOneBy({ id: patientId });
    if (!patient) throw new NotFoundException('Paciente nao encontrado');

    const [pregnancies, consultations, labResults, prescriptions, consents] = await Promise.all([
      this.patientRepo.query(`SELECT * FROM pregnancies WHERE patient_id = $1`, [patientId]),
      this.patientRepo.query(
        `SELECT c.* FROM consultations c JOIN pregnancies p ON c.pregnancy_id = p.id WHERE p.patient_id = $1`,
        [patientId],
      ),
      this.patientRepo.query(
        `SELECT l.* FROM lab_results l JOIN pregnancies p ON l.pregnancy_id = p.id WHERE p.patient_id = $1`,
        [patientId],
      ),
      this.patientRepo.query(
        `SELECT rx.* FROM prescriptions rx JOIN pregnancies p ON rx.pregnancy_id = p.id WHERE p.patient_id = $1`,
        [patientId],
      ),
      this.consentRepo.find({ where: { patientId } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      patient: {
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        email: patient.email,
        phone: patient.phone,
        bloodType: patient.bloodType,
        address: patient.address,
        city: patient.city,
        state: patient.state,
      },
      pregnancies,
      consultations,
      labResults,
      prescriptions,
      consents,
    };
  }

  async requestDeletion(patientId: string) {
    // LGPD right to erasure — mark patient data for deletion
    // In production: schedule async job to anonymize/delete after confirmation period
    await this.patientRepo.update(patientId, {
      fullName: 'DADOS_REMOVIDOS',
      email: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      cpf: `DEL_${Date.now()}`,
    });

    return { message: 'Solicitacao de exclusao registrada. Dados serao removidos em ate 15 dias uteis.' };
  }

  async getAccessLog(patientId: string) {
    return this.auditService.findPatientAccessLog(patientId);
  }

  async exportPortability(patientId: string) {
    const data = await this.exportMyData(patientId);
    return {
      format: 'json',
      data,
      generatedAt: new Date().toISOString(),
    };
  }
}
