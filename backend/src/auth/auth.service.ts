import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity.js';
import { UserRole } from './auth.enums.js';
import { PatientsService } from '../patients/patients.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { PatientLoginDto } from './dto/patient-login.dto.js';
import type { AuthTokenPayload } from './strategies/jwt.strategy.js';

const SALT_ROUNDS = 12;
const ACCESS_EXPIRES_SECONDS = 8 * 60 * 60;   // 8h
const REFRESH_EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7d

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly patientsService: PatientsService,
  ) {}

  // ── Register ──

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email ja cadastrado');

    const hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.userRepo.create({ ...dto, password: hash });
    const saved = await this.userRepo.save(user);

    const { password, refreshTokenHash, ...result } = saved;
    return result;
  }

  // ── Login médico ──

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    return this.generateTokens(user);
  }

  // ── Login paciente ──

  async patientLogin(dto: PatientLoginDto) {
    const patients = await this.patientsService.search(dto.email);
    const patient = patients.find(
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
      expiresIn: ACCESS_EXPIRES_SECONDS,
    });

    return { accessToken, role: UserRole.PATIENT, patientId: patient.id };
  }

  // ── Refresh ──

  async refresh(refreshToken: string) {
    let payload: AuthTokenPayload;
    try {
      payload = this.jwtService.verify<AuthTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    const user = await this.userRepo.findOneBy({ id: payload.sub });
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenMatch) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    return this.generateTokens(user);
  }

  // ── Logout ──

  async logout(userId: string) {
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

  // ── Privados ──

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_EXPIRES_SECONDS,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: REFRESH_EXPIRES_SECONDS,
    });

    const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.userRepo.update(user.id, { refreshTokenHash: refreshHash });

    return {
      accessToken,
      refreshToken,
      role: user.role,
      userId: user.id,
    };
  }
}
