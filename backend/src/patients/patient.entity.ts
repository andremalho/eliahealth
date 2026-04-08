import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BloodTypeABO, BloodTypeRH, HemoglobinElectrophoresis } from './patient.enums.js';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ unique: true })
  cpf: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'blood_type', type: 'varchar', nullable: true })
  bloodType: string | null;

  @Column({ name: 'blood_type_abo', type: 'enum', enum: BloodTypeABO, nullable: true })
  bloodTypeABO: BloodTypeABO | null;

  @Column({ name: 'blood_type_rh', type: 'enum', enum: BloodTypeRH, nullable: true })
  bloodTypeRH: BloodTypeRH | null;

  @Column({ name: 'hemoglobin_electrophoresis', type: 'enum', enum: HemoglobinElectrophoresis, nullable: true })
  hemoglobinElectrophoresis: HemoglobinElectrophoresis | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ name: 'zip_code', type: 'varchar', nullable: true })
  zipCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  height: number | null;

  @Column({ type: 'text', nullable: true })
  comorbidities: string | null;

  @Column({ name: 'comorbidities_selected', type: 'jsonb', nullable: true })
  comorbiditiesSelected: string[] | null;

  @Column({ name: 'comorbidities_notes', type: 'text', nullable: true })
  comorbiditiesNotes: string | null;

  @Column({ type: 'text', nullable: true })
  allergies: string | null;

  @Column({ name: 'allergies_selected', type: 'jsonb', nullable: true })
  allergiesSelected: string[] | null;

  @Column({ name: 'allergies_notes', type: 'text', nullable: true })
  allergiesNotes: string | null;

  @Column({ type: 'text', nullable: true })
  addictions: string | null;

  @Column({ name: 'addictions_selected', type: 'jsonb', nullable: true })
  addictionsSelected: string[] | null;

  @Column({ name: 'addictions_notes', type: 'text', nullable: true })
  addictionsNotes: string | null;

  @Column({ type: 'text', nullable: true })
  surgeries: string | null;

  @Column({ name: 'family_history', type: 'text', nullable: true })
  familyHistory: string | null;

  @Column({ name: 'menarche_age', type: 'int', nullable: true })
  menarcheAge: number | null;

  @Column({ name: 'menstrual_cycle', type: 'varchar', length: 20, nullable: true })
  menstrualCycle: string | null;

  @Column({ type: 'boolean', nullable: true })
  dysmenorrhea: boolean | null;

  @Column({ name: 'profile_notes', type: 'text', nullable: true })
  profileNotes: string | null;

  @Column({ name: 'preferred_language', type: 'varchar', default: 'pt_BR' })
  preferredLanguage: string;

  @Column({
    name: 'lgpd_consent_at',
    type: 'timestamptz',
    nullable: true,
  })
  lgpdConsentAt: Date | null;

  @Column({ name: 'profile_completed_at', type: 'timestamptz', nullable: true })
  profileCompletedAt: Date | null;

  @Column({ name: 'verification_email_sent_at', type: 'timestamptz', nullable: true })
  verificationEmailSentAt: Date | null;

  @Column({ name: 'zip_code_partial', type: 'varchar', length: 5, nullable: true })
  zipCodePartial: string | null;

  @Column({ name: 'cpf_hash', type: 'varchar', nullable: true })
  cpfHash: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
