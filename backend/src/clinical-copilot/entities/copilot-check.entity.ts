import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Consultation } from '../../consultations/consultation.entity.js';
import { Patient } from '../../patients/patient.entity.js';
import { ClinicalContext } from '../enums/clinical-context.enum.js';
import { CopilotCheckItem } from './copilot-check-item.entity.js';

@Entity('copilot_checks')
export class CopilotCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'consultation_id', type: 'uuid' })
  consultationId: string;

  @ManyToOne(() => Consultation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultation_id' })
  consultation: Consultation;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @Column({
    name: 'clinical_context',
    type: 'enum',
    enum: ClinicalContext,
    enumName: 'copilot_check_context_enum',
    default: ClinicalContext.GENERAL,
  })
  clinicalContext: ClinicalContext;

  @OneToMany(() => CopilotCheckItem, (item) => item.copilotCheck, {
    cascade: true,
    eager: true,
  })
  items: CopilotCheckItem[];

  @Column({ name: 'total_items', type: 'int', default: 0 })
  totalItems: number;

  @Column({ name: 'action_required_count', type: 'int', default: 0 })
  actionRequiredCount: number;

  @Column({ name: 'attention_count', type: 'int', default: 0 })
  attentionCount: number;

  @Column({ name: 'ok_count', type: 'int', default: 0 })
  okCount: number;

  @Column({ name: 'reviewed_by_doctor', type: 'boolean', default: false })
  reviewedByDoctor: boolean;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'generation_time_ms', type: 'int', nullable: true })
  generationTimeMs: number | null;

  @Column({ name: 'source_snapshot', type: 'jsonb', nullable: true })
  sourceSnapshot: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
