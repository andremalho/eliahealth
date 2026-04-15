import {
  Controller,
  Post,
  Get,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PhoneVerificationService } from '../shared/whatsapp/phone-verification.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { PatientLoginDto } from './dto/patient-login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly phoneVerification: PhoneVerificationService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('patient/login')
  patientLogin(@Body() dto: PatientLoginDto) {
    return this.authService.patientLogin(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@CurrentUser('userId') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('me')
  me(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.authService.me(userId, role);
  }

  // ── WhatsApp OTP ──

  @Public()
  @Post('send-otp')
  sendOtp(@Body() body: { phone: string }) {
    return this.phoneVerification.generateOTP(body.phone).then(() => ({ sent: true }));
  }

  @Public()
  @Post('verify-otp')
  verifyOtp(@Body() body: { phone: string; code: string }) {
    this.phoneVerification.verifyOTP(body.phone, body.code);
    return this.authService.loginByPhone(body.phone);
  }

  // ── Doctors list ──

  @Get('doctors')
  doctors(@CurrentUser('tenantId') tenantId: string) {
    return this.authService.listDoctors(tenantId);
  }

  // ── Certificacao Digital ──

  @Public()
  @Post('certificate-login')
  certificateLogin(
    @Body() body: {
      thumbprint: string;
      subject: string;
      issuer: string;
      notAfter: string;
      email: string;
    },
  ) {
    return this.authService.loginByCertificate(body);
  }

  @Post('register-certificate')
  registerCertificate(
    @CurrentUser('userId') userId: string,
    @Body() body: {
      thumbprint: string;
      subject: string;
      issuer: string;
      notAfter: string;
    },
  ) {
    return this.authService.registerCertificate(userId, body);
  }
}
