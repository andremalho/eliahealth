import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { PatientVerification } from './patient-verification.entity.js';
import { Patient } from '../patients/patient.entity.js';

const TOKEN_EXPIRY_HOURS = 72;

@Injectable()
export class PatientVerificationService {
  private readonly logger = new Logger(PatientVerificationService.name);

  constructor(
    @InjectRepository(PatientVerification)
    private readonly repo: Repository<PatientVerification>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(
    patientId: string,
    physicianName?: string,
  ): Promise<PatientVerification> {
    const patient = await this.patientRepo.findOneBy({ id: patientId });
    if (!patient) {
      throw new NotFoundException('Paciente nao encontrado');
    }
    if (!patient.email) {
      throw new BadRequestException('Paciente nao possui email cadastrado');
    }

    const token = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    const verification = this.repo.create({
      patientId,
      token,
      tokenExpiresAt,
    });
    await this.repo.save(verification);

    // Mark email sent timestamp
    await this.patientRepo.update(patientId, {
      verificationEmailSentAt: new Date(),
    });

    const appUrl = this.configService.get(
      'APP_URL',
      'https://app.eliahealth.com',
    );
    const verificationLink = `${appUrl}/paciente/verificar?token=${token}`;

    const emailHtml = this.buildWelcomeEmail(
      patient.fullName,
      physicianName ?? 'sua equipe medica',
      verificationLink,
    );

    // Log email for now — actual SMTP integration pending
    this.logger.log(
      `Verification email for patient ${patientId} (${patient.email})`,
    );
    this.logger.debug(
      JSON.stringify({
        to: patient.email,
        subject: 'Seu prontuario digital esta pronto — EliaHealth',
        html: emailHtml,
        verificationLink,
      }),
    );

    return verification;
  }

  async verifyToken(token: string) {
    const verification = await this.repo.findOne({
      where: { token },
      relations: ['patient'],
    });

    if (!verification) {
      throw new NotFoundException('Token de verificacao invalido');
    }

    if (verification.isUsed) {
      throw new BadRequestException('Token ja utilizado');
    }

    if (new Date() > verification.tokenExpiresAt) {
      throw new BadRequestException('Token expirado');
    }

    verification.isUsed = true;
    verification.usedAt = new Date();
    await this.repo.save(verification);

    const patient = verification.patient;
    return {
      patientId: patient.id,
      fullName: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      cpf: patient.cpf,
      zipCode: patient.zipCode,
      address: patient.address,
      city: patient.city,
      state: patient.state,
    };
  }

  private buildWelcomeEmail(
    patientName: string,
    physicianName: string,
    link: string,
  ): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #7c3aed; padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">EliaHealth</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #1f2937; margin-top: 0;">Ola, ${patientName}!</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        <strong>${physicianName}</strong> preparou seu prontuario digital na EliaHealth.
        Agora voce tem acesso ao seu portal da paciente, onde pode:
      </p>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li>Acompanhar sua gestacao e idade gestacional</li>
        <li>Ver resultados de exames e ultrassonografias</li>
        <li>Acessar suas prescricoes e receitas</li>
        <li>Consultar o calendario de vacinas</li>
        <li>Atualizar seus dados pessoais</li>
      </ul>
      <p style="color: #4b5563; line-height: 1.6;">
        Para comecar, clique no botao abaixo e complete seu cadastro.
        Precisaremos de algumas informacoes para garantir a seguranca do seu prontuario.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${link}"
           style="display: inline-block; background: #7c3aed; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Acessar meu prontuario
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 13px;">
        Este link expira em 72 horas. Caso expire, solicite um novo ao seu medico.
      </p>
    </div>
    <div style="background: #f9fafb; padding: 20px 32px; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        EliaHealth — Cuidado gestacional inteligente
      </p>
    </div>
  </div>
</body>
</html>`;
  }
}
