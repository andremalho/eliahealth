import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { Patient } from '../patients/patient.entity.js';
import { UserRole } from '../auth/auth.enums.js';
import { PatientVerificationService } from '../patient-verification/patient-verification.service.js';
import { ResearchService } from '../research/research.service.js';
import { UpdatePortalProfileDto } from './dto/update-portal-profile.dto.js';
import { CompleteProfileDto } from './dto/complete-profile.dto.js';

const ACCESS_EXPIRES_SECONDS = 8 * 60 * 60;

@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly jwtService: JwtService,
    private readonly verificationService: PatientVerificationService,
    private readonly researchService: ResearchService,
  ) {}

  async verify(token: string) {
    return this.verificationService.verifyToken(token);
  }

  async completeProfile(patientId: string, dto: CompleteProfileDto) {
    const patient = await this.patientRepo.findOneBy({ id: patientId });
    if (!patient) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    // Hash CPF before storing
    const cpfHash = createHash('sha256').update(dto.cpf).digest('hex');

    // Partial zip for anonymized research
    const zipCodePartial = dto.zipCode
      ? dto.zipCode.replace(/\D/g, '').substring(0, 5)
      : null;

    // Age group calculation
    const dob = new Date(dto.dateOfBirth);
    const age = this.calculateAge(dob);
    const ageGroup = this.getAgeGroup(age);

    patient.fullName = dto.fullName;
    patient.dateOfBirth = dto.dateOfBirth;
    patient.cpf = dto.cpf;
    patient.cpfHash = cpfHash;
    patient.zipCode = dto.zipCode;
    patient.zipCodePartial = zipCodePartial;
    patient.address = dto.address ?? patient.address;
    patient.city = dto.city ?? patient.city;
    patient.state = dto.state ?? patient.state;
    patient.phone = dto.phone ?? patient.phone;
    patient.lgpdConsentAt = new Date();
    patient.profileCompletedAt = new Date();

    await this.patientRepo.save(patient);

    // Anonymize for research if consented
    if (dto.consentForResearch) {
      const pregnancies = await this.patientRepo.query(
        `SELECT id FROM pregnancies WHERE patient_id = $1`,
        [patientId],
      );
      for (const preg of pregnancies) {
        try {
          await this.researchService.anonymizeAndSave(preg.id);
        } catch {
          // Non-critical — log but don't block profile completion
        }
      }
    }

    // Issue portal JWT
    const payload = {
      sub: patient.id,
      email: patient.email!,
      role: UserRole.PATIENT,
      patientId: patient.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_EXPIRES_SECONDS,
    });

    return {
      accessToken,
      role: UserRole.PATIENT,
      patientId: patient.id,
      ageGroup,
      profileCompletedAt: patient.profileCompletedAt,
    };
  }

  async updateProfile(patientId: string, dto: UpdatePortalProfileDto) {
    const patient = await this.patientRepo.findOneBy({ id: patientId });
    if (!patient) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    if (dto.zipCode) {
      (patient as any).zipCodePartial = dto.zipCode
        .replace(/\D/g, '')
        .substring(0, 5);
    }

    Object.assign(patient, dto);
    return this.patientRepo.save(patient);
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return 'under_18';
    if (age <= 24) return '18_24';
    if (age <= 29) return '25_29';
    if (age <= 34) return '30_34';
    if (age <= 39) return '35_39';
    return '40_plus';
  }
}
