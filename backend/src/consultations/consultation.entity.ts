import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { EdemaGrade, FetalPresentation, UmbilicalDopplerResult } from './consultation.enums.js';

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' })
  pregnancyId: string;

  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'gestational_age_days', type: 'int' })
  gestationalAgeDays: number;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 5, scale: 2, nullable: true })
  weightKg: number | null;

  @Column({ name: 'bp_systolic', type: 'int', nullable: true })
  bpSystolic: number | null;

  @Column({ name: 'bp_diastolic', type: 'int', nullable: true })
  bpDiastolic: number | null;

  @Column({ name: 'fundal_height_cm', type: 'decimal', precision: 4, scale: 1, nullable: true })
  fundalHeightCm: number | null;

  @Column({ name: 'fetal_heart_rate', type: 'int', nullable: true })
  fetalHeartRate: number | null;

  @Column({ name: 'edema_grade', type: 'enum', enum: EdemaGrade, nullable: true })
  edemaGrade: EdemaGrade | null;

  @Column({ type: 'text', nullable: true })
  subjective: string | null;

  @Column({ type: 'text', nullable: true })
  objective: string | null;

  @Column({ type: 'text', nullable: true })
  assessment: string | null;

  @Column({ type: 'text', nullable: true })
  plan: string | null;

  @Column({ name: 'ai_suggestions', type: 'jsonb', nullable: true })
  aiSuggestions: Record<string, unknown> | null;

  @Column({ name: 'fetal_movements', type: 'varchar', nullable: true })
  fetalMovements: string | null;

  @Column({ name: 'vaginal_exam', type: 'varchar', nullable: true })
  vaginalExam: string | null;

  @Column({ name: 'fetal_presentation', type: 'enum', enum: FetalPresentation, nullable: true })
  fetalPresentation: FetalPresentation | null;

  @Column({ name: 'estimated_fetal_weight', type: 'varchar', nullable: true })
  estimatedFetalWeight: string | null;

  @Column({ name: 'umbilical_doppler', type: 'enum', enum: UmbilicalDopplerResult, nullable: true })
  umbilicalDoppler: UmbilicalDopplerResult | null;

  @Column({ name: 'biophysical_profile', type: 'int', nullable: true })
  biophysicalProfile: number | null;

  @Column({ name: 'physical_exam_notes', type: 'text', nullable: true })
  physicalExamNotes: string | null;

  @Column({ name: 'next_appointment_date', type: 'date', nullable: true })
  nextAppointmentDate: string | null;

  @Column({ name: 'confidential_notes', type: 'text', nullable: true })
  confidentialNotes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
