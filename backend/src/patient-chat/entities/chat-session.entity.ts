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
import { Patient } from '../../patients/patient.entity.js';
import { SessionStatus } from '../enums/session-status.enum.js';
import { ChatMessage } from './chat-message.entity.js';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'consultation_id', type: 'uuid', nullable: true })
  consultationId: string | null;

  @Column({ name: 'summary_id', type: 'uuid', nullable: true })
  summaryId: string | null;

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctorId: string | null;

  @Column({ name: 'whatsapp_number', type: 'varchar', length: 20 })
  whatsappNumber: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    enumName: 'chat_session_status_enum',
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @Column({ name: 'consultation_context', type: 'jsonb', nullable: true })
  consultationContext: Record<string, unknown> | null;

  @Column({ name: 'message_count', type: 'int', default: 0 })
  messageCount: number;

  @Column({ name: 'escalated_to_doctor', type: 'boolean', default: false })
  escalatedToDoctor: boolean;

  @Column({ name: 'escalated_at', type: 'timestamptz', nullable: true })
  escalatedAt: Date | null;

  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason: string | null;

  @OneToMany(() => ChatMessage, (msg) => msg.session, { cascade: true })
  messages: ChatMessage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
