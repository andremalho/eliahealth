import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { LabIntegration } from './lab-integration.entity.js';

export enum WebhookLogStatus { RECEIVED = 'received', MATCHED = 'matched', UNMATCHED = 'unmatched', ERROR = 'error' }

@Entity('lab_webhook_logs')
export class LabWebhookLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'lab_integration_id', type: 'uuid' }) labIntegrationId: string;
  @ManyToOne(() => LabIntegration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lab_integration_id' }) labIntegration: LabIntegration;

  @Column({ name: 'patient_identifier', type: 'varchar' }) patientIdentifier: string;
  @Column({ type: 'jsonb' }) payload: Record<string, unknown>;
  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true }) processedAt: Date | null;
  @Column({ type: 'enum', enum: WebhookLogStatus, default: WebhookLogStatus.RECEIVED }) status: WebhookLogStatus;
  @Column({ type: 'text', nullable: true }) error: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
