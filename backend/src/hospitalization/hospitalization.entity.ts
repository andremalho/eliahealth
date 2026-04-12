import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity.js';
import { User } from '../auth/user.entity.js';

export enum AdmissionType {
  OBSTETRIC = 'obstetric',
  GYNECOLOGIC = 'gynecologic',
  CLINICAL = 'clinical',
}

export enum AdmissionStatus {
  ACTIVE = 'active',
  DISCHARGED = 'discharged',
  TRANSFERRED = 'transferred',
  DEATH = 'death',
}

@Entity('hospitalizations')
export class Hospitalization {
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

  @Column({ name: 'attending_doctor_id', type: 'uuid' })
  attendingDoctorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'attending_doctor_id' })
  attendingDoctor: User;

  @Column({ name: 'admission_date', type: 'timestamptz' })
  admissionDate: Date;

  @Column({ name: 'discharge_date', type: 'timestamptz', nullable: true })
  dischargeDate: Date | null;

  @Column({ name: 'admission_type', type: 'enum', enum: AdmissionType })
  admissionType: AdmissionType;

  @Column({ type: 'enum', enum: AdmissionStatus, default: AdmissionStatus.ACTIVE })
  status: AdmissionStatus;

  @Column({ name: 'admission_diagnosis', type: 'text' })
  admissionDiagnosis: string;

  @Column({ name: 'icd10_codes', type: 'jsonb', nullable: true })
  icd10Codes: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  bed: string | null;

  @Column({ type: 'varchar', nullable: true })
  ward: string | null;

  @Column({ name: 'discharge_summary', type: 'text', nullable: true })
  dischargeSummary: string | null;

  @Column({ name: 'discharge_diagnosis', type: 'text', nullable: true })
  dischargeDiagnosis: string | null;

  @Column({ name: 'discharge_instructions', type: 'text', nullable: true })
  dischargeInstructions: string | null;

  @Column({ type: 'jsonb', nullable: true })
  alerts: { level: string; message: string }[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
