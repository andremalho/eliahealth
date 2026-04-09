import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { Patient } from '../patients/patient.entity.js';
import { PortalOtp } from './portal-otp.entity.js';
import { UserRole } from '../auth/auth.enums.js';
import { PatientVerificationService } from '../patient-verification/patient-verification.service.js';
import { ResearchService } from '../research/research.service.js';
import { MailService } from '../mail/mail.service.js';
import { WhatsAppService } from '../shared/whatsapp/whatsapp.service.js';
import { UpdatePortalProfileDto } from './dto/update-portal-profile.dto.js';
import { CompleteProfileDto } from './dto/complete-profile.dto.js';

const ACCESS_EXPIRES_SECONDS = 8 * 60 * 60;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(PortalOtp)
    private readonly otpRepo: Repository<PortalOtp>,
    private readonly jwtService: JwtService,
    private readonly verificationService: PatientVerificationService,
    private readonly researchService: ResearchService,
    private readonly mailService: MailService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  async verify(token: string) {
    return this.verificationService.verifyToken(token);
  }

  // ── OTP Login ──

  async requestOtp(cpf: string) {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new BadRequestException('CPF invalido');
    }

    const patient = await this.patientRepo.findOneBy({ cpf: cleanCpf });
    if (!patient) {
      // Nao revelar se CPF existe — retornar sucesso generico
      return { sent: true, channels: [] };
    }

    if (!patient.email && !patient.phone) {
      throw new BadRequestException(
        'Sem email ou telefone cadastrados — solicite ao seu medico que registre um contato',
      );
    }

    // Gera codigo de 6 digitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const channels: string[] = [];
    if (patient.email) channels.push('email');
    if (patient.phone) channels.push('whatsapp');

    // Cria 1 registro com primeiro canal disponivel (codigo unico para os dois envios)
    const otp = this.otpRepo.create({
      patientId: patient.id,
      code,
      channel: channels.join(','),
      expiresAt,
      attempts: 0,
    });
    await this.otpRepo.save(otp);

    // Envio do OTP
    if (patient.email) {
      this.mailService.sendOtpEmail(patient.email, code, patient.fullName).catch((err) => {
        this.logger.error(`Falha ao enviar OTP por email: ${err}`);
      });
    }
    if (patient.phone) {
      this.whatsAppService.sendOTP(patient.phone.replace(/\D/g, ''), code).catch((err) => {
        this.logger.error(`Falha ao enviar OTP por WhatsApp: ${err}`);
      });
    }

    return {
      sent: true,
      channels,
      // DEV ONLY: retorna codigo no response. REMOVER em producao.
      devCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  async verifyOtp(cpf: string, code: string) {
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanCode = code.replace(/\D/g, '');

    const patient = await this.patientRepo.findOneBy({ cpf: cleanCpf });
    if (!patient) {
      throw new BadRequestException('Codigo invalido');
    }

    // Codigo mestre — bypass para teste (so funciona se nao for producao)
    const masterOtp = process.env.PORTAL_MASTER_OTP;
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction && masterOtp && cleanCode === masterOtp.replace(/\D/g, '')) {
      this.logger.warn(`Login com codigo mestre para paciente ${patient.id}`);
    } else {
      const otp = await this.otpRepo.findOne({
        where: {
          patientId: patient.id,
          expiresAt: MoreThan(new Date()),
        },
        order: { createdAt: 'DESC' },
      });

      if (!otp) {
        throw new BadRequestException('Codigo expirado ou nao encontrado. Solicite um novo.');
      }

      if (otp.usedAt) {
        throw new BadRequestException('Codigo ja utilizado. Solicite um novo.');
      }

      if (otp.attempts >= OTP_MAX_ATTEMPTS) {
        throw new BadRequestException('Limite de tentativas excedido. Solicite um novo codigo.');
      }

      if (otp.code !== cleanCode) {
        otp.attempts++;
        await this.otpRepo.save(otp);
        throw new BadRequestException('Codigo incorreto');
      }

      otp.usedAt = new Date();
      await this.otpRepo.save(otp);
    }

    // Issue portal JWT (30 dias para mobile)
    const payload = {
      sub: patient.id,
      email: patient.email!,
      role: UserRole.PATIENT,
      patientId: patient.id,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      role: UserRole.PATIENT,
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        email: patient.email,
        phone: patient.phone,
      },
    };
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
