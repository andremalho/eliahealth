import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { InsightType } from '../enums/insight-type.enum.js';
import { TriggerEvent } from '../enums/trigger-event.enum.js';

@Entity('copilot_insights')
export class CopilotInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'consultation_id', type: 'uuid' })
  consultationId: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @Column({
    type: 'enum',
    enum: InsightType,
    enumName: 'copilot_insight_type_enum',
  })
  type: InsightType;

  @Column({
    name: 'triggered_by',
    type: 'enum',
    enum: TriggerEvent,
    enumName: 'copilot_trigger_event_enum',
  })
  triggeredBy: TriggerEvent;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'suggested_action', type: 'text', nullable: true })
  suggestedAction: string | null;

  @Column({ name: 'guideline_reference', type: 'varchar', length: 200, nullable: true })
  guidelineReference: string | null;

  @Column({ type: 'varchar', length: 20, default: 'attention' })
  severity: string;

  @Column({ name: 'doctor_action', type: 'varchar', length: 20, nullable: true })
  doctorAction: string | null;

  @Column({ name: 'doctor_note', type: 'text', nullable: true })
  doctorNote: string | null;

  @Column({ name: 'generation_time_ms', type: 'int', nullable: true })
  generationTimeMs: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
