import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/patient.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { PublicShare } from './public-share.entity.js';
import { GuestAccess } from './guest-access.entity.js';
import { PortalOtp } from './portal-otp.entity.js';
import { PortalController } from './portal.controller.js';
import { PortalService } from './portal.service.js';
import { PortalDataService } from './portal-data.service.js';
import { PatientVerificationModule } from '../patient-verification/patient-verification.module.js';
import { ResearchModule } from '../research/research.module.js';
import { PregnanciesModule } from '../pregnancies/pregnancies.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, Pregnancy, PublicShare, GuestAccess, PortalOtp]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'fallback-secret'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
    PatientVerificationModule,
    ResearchModule,
    PregnanciesModule,
    AuditModule,
  ],
  controllers: [PortalController],
  providers: [PortalService, PortalDataService],
})
export class PortalModule {}
