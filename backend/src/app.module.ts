import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { PatientsModule } from './patients/patients.module.js';
import { PregnanciesModule } from './pregnancies/pregnancies.module.js';
import { ConsultationsModule } from './consultations/consultations.module.js';
import { LabResultsModule } from './lab-results/lab-results.module.js';
import { ClinicalProtocolsModule } from './clinical-protocols/clinical-protocols.module.js';
import { CopilotModule } from './copilot/copilot.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_NAME', 'eliahealth'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
        migrations: ['dist/migrations/*{.ts,.js}'],
      }),
    }),
    AuthModule,
    PatientsModule,
    PregnanciesModule,
    ConsultationsModule,
    LabResultsModule,
    ClinicalProtocolsModule,
    CopilotModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
