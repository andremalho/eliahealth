import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Consultation } from '../consultations/consultation.entity.js';
import { Patient } from '../patients/patient.entity.js';
import { SummaryStatus } from './enums/summary-status.enum.js';
import { DeliveryChannel } from './enums/delivery-channel.enum.js';

export interface SummarySourceData {
  diagnoses: string[];
  prescriptions: string[];
  examsRequested: string[];
  orientations: string[];
  alerts: string[];
  gestationalAge?: string;
}

export interface DeliveryLogEntry {
  channel: string;
  status: string;
  timestamp: string;
  error?: string;
}

@Entity('consultation_summaries')
export class ConsultationSummary {
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

  @Column({ name: 'summary_text', type: 'text' })
  summaryText: string;

  @Column({ name: 'original_ai_text', type: 'text', nullable: true })
  originalAiText: string | null;

  @Column({ name: 'source_data', type: 'jsonb', nullable: true })
  sourceData: SummarySourceData | null;

  @Column({
    type: 'enum',
    enum: SummaryStatus,
    enumName: 'consultation_summary_status_enum',
    default: SummaryStatus.GENERATING,
  })
  status: SummaryStatus;

  @Column({
    name: 'delivery_channel',
    type: 'enum',
    enum: DeliveryChannel,
    enumName: 'consultation_summary_channel_enum',
    default: DeliveryChannel.BOTH,
  })
  deliveryChannel: DeliveryChannel;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @Column({ name: 'delivery_log', type: 'jsonb', default: [] })
  deliveryLog: DeliveryLogEntry[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
