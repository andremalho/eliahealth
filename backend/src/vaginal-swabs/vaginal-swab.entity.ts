import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

export enum SwabExamType {
  ONCOTIC_CYTOLOGY = 'oncotic_cytology',
  COLPOCITOLOGIA_ONCOTICA = 'colpocitologia_oncotica',
  STREPTOCOCCUS_B = 'streptococcus_b',
  PCR_STREPTOCOCCUS = 'pcr_streptococcus',
  BACTERIAL_VAGINOSIS = 'bacterial_vaginosis',
  CANDIDA = 'candida',
  TRICHOMONAS = 'trichomonas',
  CHLAMYDIA = 'chlamydia',
  PCR_CHLAMYDIA = 'pcr_chlamydia',
  GONORRHEA = 'gonorrhea',
  PCR_GONORRHEA = 'pcr_gonorrhea',
  PCR_HPV = 'pcr_hpv',
  OTHER = 'other',
}

export enum SwabStatus {
  PENDING = 'pending',
  NORMAL = 'normal',
  ALTERED = 'altered',
  CRITICAL = 'critical',
}

export enum SwabResultDropdown {
  NEGATIVE = 'negative',
  POSITIVE = 'positive',
  LOW_RISK = 'low_risk',
  HIGH_RISK = 'high_risk',
}

const DST_TYPES: SwabExamType[] = [
  SwabExamType.CHLAMYDIA, SwabExamType.GONORRHEA, SwabExamType.TRICHOMONAS,
  SwabExamType.PCR_CHLAMYDIA, SwabExamType.PCR_GONORRHEA,
];

/** Exam types that use the resultDropdown field instead of free text */
const DROPDOWN_EXAM_TYPES: SwabExamType[] = [
  SwabExamType.PCR_STREPTOCOCCUS,
  SwabExamType.PCR_HPV,
];

@Entity('vaginal_swabs')
export class VaginalSwab {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' }) pregnancyId: string;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'collection_date', type: 'date' }) collectionDate: string;
  @Column({ name: 'exam_type', type: 'enum', enum: SwabExamType }) examType: SwabExamType;
  @Column({ type: 'varchar', nullable: true }) result: string | null;
  @Column({ name: 'result_dropdown', type: 'enum', enum: SwabResultDropdown, nullable: true }) resultDropdown: SwabResultDropdown | null;
  @Column({ type: 'enum', enum: SwabStatus, default: SwabStatus.PENDING }) status: SwabStatus;
  @Column({ name: 'alert_triggered', type: 'boolean', default: false }) alertTriggered: boolean;
  @Column({ name: 'alert_message', type: 'varchar', nullable: true }) alertMessage: string | null;
  @Column({ type: 'varchar', nullable: true }) notes: string | null;
  @Column({ name: 'lab_name', type: 'varchar', nullable: true }) labName: string | null;
  @Column({ name: 'attachment_url', type: 'varchar', nullable: true }) attachmentUrl: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}

export { DST_TYPES, DROPDOWN_EXAM_TYPES };
