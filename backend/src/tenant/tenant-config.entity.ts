import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TenantType {
  CONSULTORIO = 'consultorio',
  UBS = 'ubs',
  HOSPITAL = 'hospital',
}

@Entity('tenant_configs')
export class TenantConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true, unique: true })
  tenantId: string | null;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'enum', enum: TenantType, default: TenantType.CONSULTORIO })
  type: TenantType;

  @Column({ name: 'logo_url', type: 'varchar', nullable: true })
  logoUrl: string | null;

  // ── Module flags ──
  @Column({ name: 'mod_prenatal', default: true }) modPrenatal: boolean;
  @Column({ name: 'mod_gynecology', default: true }) modGynecology: boolean;
  @Column({ name: 'mod_ultrasound', default: true }) modUltrasound: boolean;
  @Column({ name: 'mod_postpartum', default: true }) modPostpartum: boolean;
  @Column({ name: 'mod_infertility', default: false }) modInfertility: boolean;
  @Column({ name: 'mod_assisted_reproduction', default: false }) modAssistedReproduction: boolean;
  @Column({ name: 'mod_menopause', default: false }) modMenopause: boolean;
  @Column({ name: 'mod_clinical_general', default: false }) modClinicalGeneral: boolean;
  @Column({ name: 'mod_hospitalization', default: false }) modHospitalization: boolean;
  @Column({ name: 'mod_evolution', default: false }) modEvolution: boolean;
  @Column({ name: 'mod_portal', default: true }) modPortal: boolean;
  @Column({ name: 'mod_scheduling', default: true }) modScheduling: boolean;
  @Column({ name: 'mod_research', default: false }) modResearch: boolean;
  @Column({ name: 'mod_telemedicine', default: false }) modTelemedicine: boolean;
  @Column({ name: 'mod_tiss_billing', default: false }) modTissBilling: boolean;
  @Column({ name: 'mod_fhir_rnds', default: false }) modFhirRnds: boolean;

  // ── Certificacao digital ──
  @Column({ name: 'certificate_validity_days', type: 'int', default: 365 })
  certificateValidityDays: number;

  @Column({ name: 'certificate_required', type: 'boolean', default: false })
  certificateRequired: boolean;

  @Column({ name: 'certificate_providers', type: 'jsonb', default: ['icp_brasil', 'bird_id', 'certisign', 'valid'] })
  certificateProviders: string[];

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  /** Presets por tipo de unidade */
  static presets(): Record<TenantType, Partial<TenantConfig>> {
    return {
      [TenantType.CONSULTORIO]: {
        modPrenatal: true, modGynecology: true, modUltrasound: true, modPostpartum: true,
        modInfertility: true, modAssistedReproduction: true, modMenopause: true,
        modPortal: true, modScheduling: true,
      },
      [TenantType.UBS]: {
        modPrenatal: true, modGynecology: true, modClinicalGeneral: true,
        modPortal: true, modScheduling: true, modFhirRnds: true,
      },
      [TenantType.HOSPITAL]: {
        modPrenatal: true, modGynecology: true, modUltrasound: true, modPostpartum: true,
        modClinicalGeneral: true, modHospitalization: true, modEvolution: true,
        modPortal: true, modScheduling: true, modResearch: true,
        modTissBilling: true, modFhirRnds: true, modTelemedicine: true,
      },
    };
  }
}
