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
import { Consultation } from '../consultations/consultation.entity.js';
import { ExamSchedule } from '../clinical-protocols/exam-schedule.entity.js';
import {
  ExamCategory,
  LabResultStatus,
  AttachmentType,
} from './lab-result.enums.js';

@Entity('lab_results')
export class LabResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' })
  pregnancyId: string;

  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ name: 'consultation_id', type: 'uuid', nullable: true })
  consultationId: string | null;

  @ManyToOne(() => Consultation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'consultation_id' })
  consultation: Consultation | null;

  @Column({ name: 'schedule_id', type: 'uuid', nullable: true })
  scheduleId: string | null;

  @ManyToOne(() => ExamSchedule, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule: ExamSchedule | null;

  @Column({ name: 'exam_name', type: 'varchar' })
  examName: string;

  @Column({ name: 'exam_category', type: 'enum', enum: ExamCategory })
  examCategory: ExamCategory;

  @Column({ name: 'exam_subcategory', type: 'varchar', nullable: true })
  examSubcategory: string | null;

  @Column({ name: 'requested_at', type: 'date' })
  requestedAt: string;

  @Column({ name: 'result_date', type: 'date', nullable: true })
  resultDate: string | null;

  @Column({ type: 'varchar', nullable: true })
  value: string | null;

  @Column({ type: 'varchar', nullable: true })
  unit: string | null;

  @Column({ name: 'reference_min', type: 'decimal', precision: 10, scale: 4, nullable: true })
  referenceMin: number | null;

  @Column({ name: 'reference_max', type: 'decimal', precision: 10, scale: 4, nullable: true })
  referenceMax: number | null;

  @Column({ name: 'reference_text', type: 'varchar', nullable: true })
  referenceText: string | null;

  @Column({ name: 'result_text', type: 'varchar', nullable: true })
  resultText: string | null;

  @Column({ type: 'enum', enum: LabResultStatus, default: LabResultStatus.PENDING })
  status: LabResultStatus;

  @Column({ name: 'alert_triggered', type: 'boolean', default: false })
  alertTriggered: boolean;

  @Column({ name: 'alert_message', type: 'varchar', nullable: true })
  alertMessage: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'ai_interpretation', type: 'text', nullable: true })
  aiInterpretation: string | null;

  @Column({ name: 'attachment_url', type: 'varchar', nullable: true })
  attachmentUrl: string | null;

  @Column({ name: 'attachment_type', type: 'enum', enum: AttachmentType, nullable: true })
  attachmentType: AttachmentType | null;

  // TODO: integração com laboratórios — usar este campo para vincular ao ID do sistema externo
  @Column({ name: 'lab_integration_id', type: 'varchar', nullable: true })
  labIntegrationId: string | null;

  @Column({ name: 'lab_name', type: 'varchar', nullable: true })
  labName: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
