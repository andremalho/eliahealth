import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity.js';
import { GaMethod, Chorionicity, PregnancyStatus, IvfTransferType, DiabetesSubtype } from './pregnancy.enums.js';

@Entity('pregnancies')
export class Pregnancy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'lmp_date', type: 'date' })
  lmpDate: string;

  @Column({ name: 'us_dating_date', type: 'date', nullable: true })
  usDatingDate: string | null;

  @Column({ name: 'us_dating_ga_days', type: 'int', nullable: true })
  usDatingGaDays: number | null;

  @Column({ type: 'date' })
  edd: string;

  @Column({ name: 'ga_method', type: 'enum', enum: GaMethod })
  gaMethod: GaMethod;

  @Column({ name: 'ivf_transfer_type', type: 'enum', enum: IvfTransferType, nullable: true })
  ivfTransferType: IvfTransferType | null;

  @Column({ name: 'ivf_transfer_date', type: 'date', nullable: true })
  ivfTransferDate: string | null;

  @Column({ type: 'int' })
  gravida: number;

  @Column({ type: 'int' })
  para: number;

  @Column({ type: 'int' })
  abortus: number;

  @Column({ type: 'int', default: 1 })
  plurality: number;

  @Column({ type: 'enum', enum: Chorionicity, nullable: true })
  chorionicity: Chorionicity | null;

  @Column({ type: 'enum', enum: PregnancyStatus, default: PregnancyStatus.ACTIVE })
  status: PregnancyStatus;

  @Column({ name: 'high_risk_flags', type: 'jsonb', default: [] })
  highRiskFlags: string[];

  @Column({ name: 'is_high_risk', type: 'boolean', default: false })
  isHighRisk: boolean;

  @Column({ name: 'current_pathologies', type: 'text', nullable: true })
  currentPathologies: string | null;

  @Column({ name: 'current_medications', type: 'text', nullable: true })
  currentMedications: string | null;

  @Column({ type: 'text', nullable: true })
  habits: string | null;

  @Column({ type: 'int', nullable: true })
  cesareans: number | null;

  @Column({ name: 'vaginal_deliveries', type: 'int', nullable: true })
  vaginalDeliveries: number | null;

  @Column({ name: 'forceps_deliveries', type: 'int', nullable: true })
  forcepsDeliveries: number | null;

  @Column({ name: 'previous_pregnancies_notes', type: 'text', nullable: true })
  previousPregnanciesNotes: string | null;

  @Column({ name: 'diabetes_subtype', type: 'enum', enum: DiabetesSubtype, nullable: true })
  diabetesSubtype: DiabetesSubtype | null;

  @Column({ name: 'personal_history', type: 'text', nullable: true })
  personalHistory: string | null;

  @Column({ name: 'gynecological_history', type: 'text', nullable: true })
  gynecologicalHistory: string | null;

  @Column({ name: 'first_consultation_completed_at', type: 'timestamptz', nullable: true })
  firstConsultationCompletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
