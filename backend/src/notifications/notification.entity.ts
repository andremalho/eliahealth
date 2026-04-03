import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { Patient } from '../patients/patient.entity.js';

export enum NotificationType {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationTemplate {
  PORTAL_INVITE = 'portal_invite',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  EXAM_RESULT = 'exam_result',
  ALERT = 'alert',
  OTHER = 'other',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid', nullable: true }) pregnancyId: string | null;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'patient_id', type: 'uuid' }) patientId: string;
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' }) patient: Patient;

  @Column({ type: 'enum', enum: NotificationType }) type: NotificationType;
  @Column({ type: 'enum', enum: NotificationTemplate }) template: NotificationTemplate;
  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING }) status: NotificationStatus;
  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true }) sentAt: Date | null;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'jsonb', nullable: true }) metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
