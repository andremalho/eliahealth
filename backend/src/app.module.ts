import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { UltrasoundModule } from './ultrasound/ultrasound.module.js';
import { GeneticCounselingModule } from './genetic-counseling/genetic-counseling.module.js';
import { GlucoseMonitoringModule } from './glucose-monitoring/glucose-monitoring.module.js';
import { BpMonitoringModule } from './bp-monitoring/bp-monitoring.module.js';
import { NotesModule } from './notes/notes.module.js';
import { PregnancyOutcomeModule } from './pregnancy-outcome/pregnancy-outcome.module.js';
import { EmergencyContactsModule } from './emergency-contacts/emergency-contacts.module.js';
import { AiFillModule } from './ai-fill/ai-fill.module.js';
import { BirthCalendarModule } from './birth-calendar/birth-calendar.module.js';
import { TeamsModule } from './teams/teams.module.js';
import { ResearchModule } from './research/research.module.js';
import { VaccinesModule } from './vaccines/vaccines.module.js';
import { VaginalSwabsModule } from './vaginal-swabs/vaginal-swabs.module.js';
import { BiologicalFatherModule } from './biological-father/biological-father.module.js';
import { FilesModule } from './files/files.module.js';
import { PrescriptionsModule } from './prescriptions/prescriptions.module.js';
import { TenantModule } from './tenant/tenant.module.js';
import { I18nModule } from './i18n/i18n.module.js';
import { OnboardingModule } from './onboarding/onboarding.module.js';
import { PortalModule } from './portal/portal.module.js';
import { PatientVerificationModule } from './patient-verification/patient-verification.module.js';
import { UtilsModule } from './utils/utils.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { OtherExamsModule } from './other-exams/other-exams.module.js';
import { PregnancyDashboardModule } from './dashboard/pregnancy-dashboard.module.js';
import { AnnotationsModule } from './annotations/annotations.module.js';
import { ExportModule } from './export/export.module.js';
import { SecurityModule } from './security/security.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuditInterceptor } from './audit/audit.interceptor.js';
import { LgpdModule } from './lgpd/lgpd.module.js';
import { AdminModule } from './admin/admin.module.js';
import { LabIntegrationsModule } from './lab-integrations/lab-integrations.module.js';
import { WhatsAppModule } from './shared/whatsapp/whatsapp.module.js';
import { FhirModule } from './shared/fhir/fhir.module.js';
import { RndsModule } from './shared/rnds/rnds.module.js';
import { Hl7Module } from './shared/hl7/hl7.module.js';
import { CdaModule } from './shared/cda/cda.module.js';
import { LoincModule } from './shared/loinc/loinc.module.js';
import { CnesModule } from './shared/cnes/cnes.module.js';
import { PreventiveExamScheduleModule } from './preventive-exam-schedule/preventive-exam-schedule.module.js';
import { GynecologyConsultationsModule } from './gynecology-consultations/gynecology-consultations.module.js';
import { MenstrualCycleAssessmentsModule } from './menstrual-cycle-assessments/menstrual-cycle-assessments.module.js';
import { ContraceptionRecordsModule } from './contraception-records/contraception-records.module.js';
import { InfertilityWorkupsModule } from './infertility-workups/infertility-workups.module.js';
import { AssistedReproductionModule } from './assisted-reproduction/assisted-reproduction.module.js';
import { MenopauseAssessmentsModule } from './menopause-assessments/menopause-assessments.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'] }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 100 },
      { name: 'auth', ttl: 60000, limit: 20 },
    ]),
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
    SecurityModule,
    AuditModule,
    AuthModule,
    PatientsModule,
    PregnanciesModule,
    ConsultationsModule,
    LabResultsModule,
    ClinicalProtocolsModule,
    CopilotModule,
    UltrasoundModule,
    GeneticCounselingModule,
    GlucoseMonitoringModule,
    BpMonitoringModule,
    NotesModule,
    PregnancyOutcomeModule,
    EmergencyContactsModule,
    AiFillModule,
    BirthCalendarModule,
    TeamsModule,
    ResearchModule,
    VaccinesModule,
    VaginalSwabsModule,
    BiologicalFatherModule,
    FilesModule,
    PrescriptionsModule,
    TenantModule,
    I18nModule,
    OnboardingModule,
    PortalModule,
    PatientVerificationModule,
    UtilsModule,
    NotificationsModule,
    OtherExamsModule,
    PregnancyDashboardModule,
    AnnotationsModule,
    ExportModule,
    LgpdModule,
    AdminModule,
    LabIntegrationsModule,
    WhatsAppModule,
    FhirModule,
    RndsModule,
    Hl7Module,
    CdaModule,
    LoincModule,
    CnesModule,
    PreventiveExamScheduleModule,
    GynecologyConsultationsModule,
    MenstrualCycleAssessmentsModule,
    ContraceptionRecordsModule,
    InfertilityWorkupsModule,
    AssistedReproductionModule,
    MenopauseAssessmentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
