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
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { Consultation } from '../consultations/consultation.entity.js';
import { UltrasoundExamType, ImageQuality, ReportStatus } from './ultrasound.enums.js';
import { FetalBiometry } from './fetal-biometry.entity.js';
import { DopplerData } from './doppler-data.entity.js';
import { BiophysicalProfile } from './biophysical-profile.entity.js';
import { UltrasoundSummary } from './ultrasound-summary.entity.js';

@Entity('ultrasounds')
export class Ultrasound {
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

  @Column({ name: 'summary_id', type: 'uuid', nullable: true })
  summaryId: string | null;

  @ManyToOne(() => UltrasoundSummary, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'summary_id' })
  summary: UltrasoundSummary | null;

  @Column({ name: 'exam_type', type: 'enum', enum: UltrasoundExamType })
  examType: UltrasoundExamType;

  @Column({ name: 'exam_date', type: 'date' })
  examDate: string;

  @Column({ name: 'gestational_age_days', type: 'int' })
  gestationalAgeDays: number;

  @Column({ name: 'operator_name', type: 'varchar', nullable: true })
  operatorName: string | null;

  @Column({ name: 'equipment_model', type: 'varchar', nullable: true })
  equipmentModel: string | null;

  @Column({ name: 'image_quality', type: 'enum', enum: ImageQuality, default: ImageQuality.GOOD })
  imageQuality: ImageQuality;

  @Column({ name: 'voice_transcript', type: 'text', nullable: true })
  voiceTranscript: string | null;

  @Column({ name: 'ai_interpretation', type: 'text', nullable: true })
  aiInterpretation: string | null;

  @Column({ name: 'final_report', type: 'text', nullable: true })
  finalReport: string | null;

  @Column({ name: 'report_status', type: 'enum', enum: ReportStatus, default: ReportStatus.DRAFT })
  reportStatus: ReportStatus;

  @Column({ name: 'template_version', type: 'varchar', nullable: true })
  templateVersion: string | null;

  @Column({ name: 'extra_fields', type: 'jsonb', nullable: true })
  extraFields: Record<string, unknown> | null;

  @OneToMany(() => FetalBiometry, (b) => b.ultrasound, { cascade: true })
  biometries: FetalBiometry[];

  @OneToMany(() => DopplerData, (d) => d.ultrasound, { cascade: true })
  dopplers: DopplerData[];

  @OneToMany(() => BiophysicalProfile, (p) => p.ultrasound, { cascade: true })
  biophysicalProfiles: BiophysicalProfile[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
