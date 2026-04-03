import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/patient.entity.js';
import { PortalController } from './portal.controller.js';
import { PortalService } from './portal.service.js';
import { PatientVerificationModule } from '../patient-verification/patient-verification.module.js';
import { ResearchModule } from '../research/research.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'fallback-secret'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
    PatientVerificationModule,
    ResearchModule,
  ],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
