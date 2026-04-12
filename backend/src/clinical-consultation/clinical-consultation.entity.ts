import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity.js';

@Entity('clinical_consultations')
export class ClinicalConsultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctorId: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', nullable: true })
  specialty: string | null;

  // ── Sinais Vitais ──
  @Column({ name: 'bp_systolic', type: 'int', nullable: true })
  bpSystolic: number | null;

  @Column({ name: 'bp_diastolic', type: 'int', nullable: true })
  bpDiastolic: number | null;

  @Column({ name: 'heart_rate', type: 'int', nullable: true })
  heartRate: number | null;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  temperature: number | null;

  @Column({ name: 'respiratory_rate', type: 'int', nullable: true })
  respiratoryRate: number | null;

  @Column({ name: 'spo2', type: 'int', nullable: true })
  spo2: number | null;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 5, scale: 2, nullable: true })
  weightKg: number | null;

  @Column({ name: 'height_cm', type: 'decimal', precision: 5, scale: 1, nullable: true })
  heightCm: number | null;

  // ── SOAP ──
  @Column({ type: 'text', nullable: true })
  subjective: string | null;

  @Column({ type: 'text', nullable: true })
  objective: string | null;

  @Column({ type: 'text', nullable: true })
  assessment: string | null;

  @Column({ type: 'text', nullable: true })
  plan: string | null;

  // ── CID-10 / Diagnóstico ──
  @Column({ name: 'icd10_codes', type: 'jsonb', nullable: true })
  icd10Codes: string[] | null;

  @Column({ type: 'text', nullable: true })
  diagnosis: string | null;

  // ── Prescrição e Exames ──
  @Column({ name: 'prescriptions', type: 'jsonb', nullable: true })
  prescriptions: Record<string, unknown>[] | null;

  @Column({ name: 'requested_exams', type: 'jsonb', nullable: true })
  requestedExams: string[] | null;

  @Column({ name: 'referral', type: 'text', nullable: true })
  referral: string | null;

  // ── Meta ──
  @Column({ name: 'confidential_notes', type: 'text', nullable: true })
  confidentialNotes: string | null;

  @Column({ name: 'next_appointment_date', type: 'date', nullable: true })
  nextAppointmentDate: string | null;

  @Column({ type: 'jsonb', nullable: true })
  alerts: { level: string; message: string }[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
