import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity.js';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { User } from '../auth/user.entity.js';

export enum ReportStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  SIGNED = 'signed',
  EXPORTED = 'exported',
}

@Entity('ultrasound_reports')
export class UltrasoundReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'pregnancy_id', type: 'uuid', nullable: true })
  pregnancyId: string | null;

  @ManyToOne(() => Pregnancy, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy | null;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @Column({ name: 'template_id', type: 'varchar' })
  templateId: string;

  @Column({ type: 'varchar' })
  category: string;

  @Column({ name: 'report_date', type: 'date' })
  reportDate: string;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, unknown>;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.DRAFT })
  status: ReportStatus;

  @Column({ name: 'ai_interpretation', type: 'text', nullable: true })
  aiInterpretation: string | null;

  @Column({ type: 'text', nullable: true })
  conclusion: string | null;

  @Column({ type: 'jsonb', default: [] })
  images: { url: string; filename: string; order: number }[];

  @Column({ name: 'signature_hash', type: 'varchar', nullable: true })
  signatureHash: string | null;

  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true })
  signedAt: Date | null;

  @Column({ name: 'signed_by_name', type: 'varchar', nullable: true })
  signedByName: string | null;

  @Column({ name: 'signed_by_crm', type: 'varchar', nullable: true })
  signedByCrm: string | null;

  @Column({ name: 'exported_at', type: 'timestamptz', nullable: true })
  exportedAt: Date | null;

  @Column({ name: 'exported_format', type: 'varchar', nullable: true })
  exportedFormat: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'sent_via', type: 'varchar', nullable: true })
  sentVia: string | null;

  @Column({ name: 'sent_to', type: 'varchar', nullable: true })
  sentTo: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
