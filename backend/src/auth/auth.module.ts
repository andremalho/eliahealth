import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { RefreshToken } from './refresh-token.entity.js';
import { PasswordHistory } from './password-history.entity.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PhoneVerificationService } from '../shared/whatsapp/phone-verification.service.js';
import { PatientsModule } from '../patients/patients.module.js';
import { OnboardingModule } from '../onboarding/onboarding.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, PasswordHistory]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'fallback-secret'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
    PatientsModule,
    OnboardingModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PhoneVerificationService],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
