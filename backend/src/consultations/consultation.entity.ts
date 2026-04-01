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
import { EdemaGrade } from './consultation.enums.js';

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
