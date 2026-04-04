import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity.js';

export enum ConsentType {
  DATA_PROCESSING = 'data_processing',
  RESEARCH = 'research',
  DATA_SHARING = 'data_sharing',
  MARKETING = 'marketing',
}

@Entity('lgpd_consents')
export class LgpdConsent {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'patient_id', type: 'uuid' }) patientId: string;
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' }) patient: Patient;

  @Column({ name: 'consent_type', type: 'enum', enum: ConsentType }) consentType: ConsentType;
  @Column({ type: 'boolean' }) granted: boolean;
  @Column({ name: 'granted_at', type: 'timestamptz', nullable: true }) grantedAt: Date | null;
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true }) revokedAt: Date | null;
  @Column({ name: 'ip_address', type: 'varchar' }) ipAddress: string;
  @Column({ type: 'varchar' }) version: string;
  @Column({ name: 'term_text', type: 'text' }) termText: string;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
