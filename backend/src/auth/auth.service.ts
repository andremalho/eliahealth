import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity.js';
import { UserRole, CertificateProvider } from './auth.enums.js';
import { RefreshToken } from './refresh-token.entity.js';
import { PasswordHistory } from './password-history.entity.js';
import { PatientsService } from '../patients/patients.service.js';
import { OnboardingService } from '../onboarding/onboarding.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { PatientLoginDto } from './dto/patient-login.dto.js';
import type { AuthTokenPayload } from './strategies/jwt.strategy.js';

const SALT_ROUNDS = 12;
const ACCESS_EXPIRES_SECONDS = 8 * 60 * 60;   // 8h
const REFRESH_EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7d
const PATIENT_ACCESS_EXPIRES_SECONDS = 30 * 24 * 60 * 60; // 30d
const PASSWORD_HISTORY_LIMIT = 5;
const PASSWORD_EXPIRY_DAYS = 90;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordHistory)
    private readonly passwordHistoryRepo: Repository<PasswordHistory>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly patientsService: PatientsService,
    private readonly onboardingService: OnboardingService,
  ) {}

  // ── Register ──

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email ja cadastrado');

    this.validatePasswordStrength(dto.password);

    const hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.userRepo.create({ ...dto, password: hash });
    const saved = await this.userRepo.save(user);
    await this.onboardingService.seedForUser(saved.id);

    // Save to password history
    await this.passwordHistoryRepo.save(
      this.passwordHistoryRepo.create({ userId: saved.id, passwordHash: hash }),
    );

    const { password, refreshTokenHash, ...result } = saved;
    return result;
  }

  // ── Login médico ──

  async login(dto: LoginDto, ipAddress = 'unknown', userAgent: string | null = null) {
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    return this.generateTokens(user, ipAddress, userAgent);
  }

  // ── Login paciente ──

  async patientLogin(dto: PatientLoginDto) {
    const result = await this.patientsService.search(dto.email, null);
    const patient = result.data.find(
      (p) => p.email?.toLowerCase() === dto.email.toLowerCase(),
    );

    if (!patient) {
      throw new UnauthorizedException('Paciente nao encontrado');
    }

    if (patient.dateOfBirth !== dto.dateOfBirth) {
      throw new UnauthorizedException('Data de nascimento incorreta');
    }

    const payload = {
      sub: patient.id,
      email: patient.email!,
      role: UserRole.PATIENT,
      patientId: patient.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: PATIENT_ACCESS_EXPIRES_SECONDS,
    });

    return { accessToken, role: UserRole.PATIENT, patientId: patient.id };
  }

  // ── Refresh with rotation ──

  async refresh(refreshToken: string, ipAddress = 'unknown', userAgent: string | null = null) {
    let payload: AuthTokenPayload;
    try {
      payload = this.jwtService.verify<AuthTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    // Find stored refresh token
    const stored = await this.refreshTokenRepo.findOneBy({ token: refreshToken });
    if (!stored) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    // Detect reuse of revoked token (possible theft)
    if (stored.revokedAt) {
      // Revoke ALL tokens for this user as a security measure
      await this.refreshTokenRepo.update(
        { userId: stored.userId },
        { revokedAt: new Date() },
      );
      throw new UnauthorizedException('Refresh token reutilizado — todos os tokens revogados por seguranca');
    }

    if (new Date() > stored.expiresAt) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = await this.userRepo.findOneBy({ id: payload.sub });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario invalido');
    }

    // Rotate: revoke old, issue new
    stored.revokedAt = new Date();
    await this.refreshTokenRepo.save(stored);

    return this.generateTokens(user, ipAddress, userAgent);
  }

  // ── Logout ──

  async logout(userId: string) {
    // Revoke all non-revoked refresh tokens for this user
    await this.refreshTokenRepo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    await this.userRepo.update(userId, { refreshTokenHash: null });
    return { message: 'Logout realizado com sucesso' };
  }

  // ── Me ──

  async me(userId: string, role: string) {
    if (role === UserRole.PATIENT) {
      return this.patientsService.findOne(userId);
    }

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('Usuario nao encontrado');

    const { password, refreshTokenHash, ...result } = user;
    return result;
  }

  // ── Login by phone (OTP verified) ──

  async loginByPhone(phone: string) {
    const [patient] = await this.userRepo.query(
      `SELECT id, email FROM patients WHERE phone = $1 LIMIT 1`,
      [phone],
    );
    if (!patient) throw new UnauthorizedException('Paciente nao encontrado com este telefone');

    const payload = {
      sub: patient.id,
      email: patient.email ?? '',
      role: UserRole.PATIENT,
      patientId: patient.id,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: 30 * 24 * 60 * 60 });
    return { accessToken, role: UserRole.PATIENT, patientId: patient.id };
  }

  // ── Login por Certificado Digital (PKI) ──

  async loginByCertificate(cert: {
    thumbprint: string;
    subject: string;
    issuer: string;
    notAfter: string;
    email: string;
    provider: string;
  }) {
    const expiresAt = new Date(cert.notAfter);
    if (expiresAt < new Date()) {
      throw new UnauthorizedException('Certificado digital expirado');
    }

    const provider = (Object.values(CertificateProvider) as string[]).includes(cert.provider)
      ? (cert.provider as CertificateProvider)
      : CertificateProvider.OTHER;

    let user = await this.userRepo.findOneBy({ certificateThumbprint: cert.thumbprint });
    if (!user) {
      user = await this.userRepo.findOneBy({ email: cert.email });
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario nao encontrado para este certificado');
    }

    // Vincular certificado automaticamente se nao vinculado
    if (!user.certificateThumbprint) {
      user.certificateThumbprint = cert.thumbprint;
      user.certificateSubject = cert.subject;
      user.certificateIssuer = cert.issuer;
      user.certificateExpiresAt = expiresAt;
      user.certificateRegisteredAt = new Date();
      user.certificateProvider = provider;
      await this.userRepo.save(user);
    }

    return this.generateTokens(user, `certificate:${provider}`, null);
  }

  // ── Login por Token Temporario (Bird ID, VIDaaS, SafeID) ──

  async loginByToken(data: {
    token: string;
    provider: string;
    email: string;
  }) {
    const provider = (Object.values(CertificateProvider) as string[]).includes(data.provider)
      ? (data.provider as CertificateProvider)
      : CertificateProvider.OTHER;

    const user = await this.userRepo.findOneBy({ email: data.email });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    // Salvar token temporario no usuario
    user.certificateToken = data.token;
    user.certificateTokenExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8h
    user.certificateProvider = provider;
    await this.userRepo.save(user);

    return this.generateTokens(user, `token:${provider}`, null);
  }

  // ── Registrar PKI (vincular certificado ao usuario logado) ──

  async registerCertificate(
    userId: string,
    cert: { thumbprint: string; subject: string; issuer: string; notAfter: string; provider?: string },
  ) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('Usuario nao encontrado');

    const provider = cert.provider && (Object.values(CertificateProvider) as string[]).includes(cert.provider)
      ? (cert.provider as CertificateProvider)
      : CertificateProvider.ICP_BRASIL;

    user.certificateThumbprint = cert.thumbprint;
    user.certificateSubject = cert.subject;
    user.certificateIssuer = cert.issuer;
    user.certificateExpiresAt = new Date(cert.notAfter);
    user.certificateRegisteredAt = new Date();
    user.certificateProvider = provider;
    await this.userRepo.save(user);

    return { message: 'Certificado digital registrado com sucesso', provider };
  }

  // ── Doctors list ──

  async listDoctors(tenantId?: string) {
    const where: Record<string, unknown> = { role: UserRole.PHYSICIAN };
    if (tenantId) where.tenantId = tenantId;
    const doctors = await this.userRepo.find({
      where,
      select: ['id', 'name', 'email', 'specialty'],
      order: { name: 'ASC' },
    });
    return doctors;
  }

  // ── Password validation ──

  private validatePasswordStrength(password: string): void {
    if (!PASSWORD_REGEX.test(password)) {
      throw new BadRequestException(
        'Senha deve ter no minimo 8 caracteres, incluindo maiuscula, minuscula, numero e caractere especial',
      );
    }
  }

  private async checkPasswordHistory(userId: string, newPassword: string): Promise<void> {
    const history = await this.passwordHistoryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: PASSWORD_HISTORY_LIMIT,
    });

    for (const entry of history) {
      const match = await bcrypt.compare(newPassword, entry.passwordHash);
      if (match) {
        throw new BadRequestException(
          `Senha nao pode ser igual as ultimas ${PASSWORD_HISTORY_LIMIT} senhas`,
        );
      }
    }
  }

  // ── Privados ──

  private async generateTokens(user: User, ipAddress: string, userAgent: string | null) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_EXPIRES_SECONDS,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: REFRESH_EXPIRES_SECONDS,
    });

    // Store refresh token in database for rotation
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_SECONDS * 1000);
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId: user.id,
        token: refreshToken,
        expiresAt,
        ipAddress,
        userAgent,
      }),
    );

    // Keep legacy hash for backwards compat
    const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.userRepo.update(user.id, { refreshTokenHash: refreshHash });

    return {
      accessToken,
      refreshToken,
      role: user.role,
      userId: user.id,
      name: user.name,
    };
  }
}
