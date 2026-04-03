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
import {
  SummaryExamType,
  SummaryAttachmentType,
  SummaryReportStatus,
} from './ultrasound-summary.enums.js';

@Entity('ultrasound_summaries')
export class UltrasoundSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' })
  pregnancyId: string;

  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ name: 'exam_type', type: 'enum', enum: SummaryExamType })
  examType: SummaryExamType;

  @Column({ name: 'exam_date', type: 'date' })
  examDate: string;

  @Column({ name: 'gestational_age_days', type: 'int' })
  gestationalAgeDays: number;

  @Column({ name: 'performed_by', type: 'varchar', nullable: true })
  performedBy: string | null;

  @Column({ name: 'facility_name', type: 'varchar', nullable: true })
  facilityName: string | null;

  @Column({ name: 'fetal_weight_grams', type: 'int', nullable: true })
  fetalWeightGrams: number | null;

  @Column({ name: 'fetal_weight_percentile', type: 'decimal', precision: 5, scale: 2, nullable: true })
  fetalWeightPercentile: number | null;

  @Column({ name: 'attachment_url', type: 'varchar', nullable: true })
  attachmentUrl: string | null;

  @Column({ name: 'attachment_type', type: 'enum', enum: SummaryAttachmentType, nullable: true })
  attachmentType: SummaryAttachmentType | null;

  // DICOM study identifier for linking to PACS/viewer
  // INTEGRATION: DICOM Viewer (e.g. OHIF Viewer, Cornerstone.js)
  // Use dicomStudyUID to load study directly in an embedded viewer
  @Column({ name: 'dicom_study_uid', type: 'varchar', nullable: true })
  dicomStudyUID: string | null;

  @Column({ name: 'general_observations', type: 'text', nullable: true })
  generalObservations: string | null;

  @Column({ name: 'alert_triggered', type: 'boolean', default: false })
  alertTriggered: boolean;

  @Column({ name: 'alert_message', type: 'varchar', nullable: true })
  alertMessage: string | null;

  @Column({ name: 'ai_extracted_data', type: 'jsonb', nullable: true })
  aiExtractedData: Record<string, unknown> | null;

  @Column({ name: 'specific_findings', type: 'jsonb', nullable: true })
  specificFindings: Record<string, unknown> | null;

  @Column({ name: 'report_status', type: 'enum', enum: SummaryReportStatus, default: SummaryReportStatus.UPLOADED })
  reportStatus: SummaryReportStatus;

  // Laudos podem ser assinados digitalmente via ICP-Brasil
  @Column({ name: 'digital_signature_id', type: 'varchar', nullable: true })
  digitalSignatureId: string | null;

  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true })
  signedAt: Date | null;

  @Column({ name: 'signed_document_url', type: 'varchar', nullable: true })
  signedDocumentUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
