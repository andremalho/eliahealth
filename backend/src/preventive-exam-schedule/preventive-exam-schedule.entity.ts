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
import {
  WomensLifePhase,
  PreventiveExamItem,
  VaccinationItem,
  PreventiveAlert,
} from './preventive-exam-schedule.enums.js';

@Entity('preventive_exam_schedules')
export class PreventiveExamSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'generated_date', type: 'date' })
  generatedDate: string;

  @Column({ name: 'patient_age_at_generation', type: 'int' })
  patientAgeAtGeneration: number;

  @Column({ name: 'life_phase', type: 'enum', enum: WomensLifePhase })
  lifePhase: WomensLifePhase;

  @Column({ name: 'exam_schedule', type: 'jsonb' })
  examSchedule: PreventiveExamItem[];

  @Column({ name: 'vaccination_schedule', type: 'jsonb', nullable: true })
  vaccinationSchedule: VaccinationItem[] | null;

  @Column({ name: 'clinical_alerts', type: 'jsonb', nullable: true })
  clinicalAlerts: PreventiveAlert[] | null;

  @Column({ name: 'next_review_date', type: 'date' })
  nextReviewDate: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
