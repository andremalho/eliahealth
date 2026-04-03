import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

export enum SwabExamType {
  ONCOTIC_CYTOLOGY = 'oncotic_cytology', STREPTOCOCCUS_B = 'streptococcus_b',
  BACTERIAL_VAGINOSIS = 'bacterial_vaginosis', CANDIDA = 'candida', TRICHOMONAS = 'trichomonas',
  CHLAMYDIA = 'chlamydia', GONORRHEA = 'gonorrhea', OTHER = 'other',
}
export enum SwabStatus { PENDING = 'pending', NORMAL = 'normal', ALTERED = 'altered', CRITICAL = 'critical' }

const DST_TYPES: SwabExamType[] = [SwabExamType.CHLAMYDIA, SwabExamType.GONORRHEA, SwabExamType.TRICHOMONAS];

@Entity('vaginal_swabs')
export class VaginalSwab {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' }) pregnancyId: string;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'collection_date', type: 'date' }) collectionDate: string;
  @Column({ name: 'exam_type', type: 'enum', enum: SwabExamType }) examType: SwabExamType;
  @Column({ type: 'varchar', nullable: true }) result: string | null;
  @Column({ type: 'enum', enum: SwabStatus, default: SwabStatus.PENDING }) status: SwabStatus;
  @Column({ name: 'alert_triggered', type: 'boolean', default: false }) alertTriggered: boolean;
  @Column({ name: 'alert_message', type: 'varchar', nullable: true }) alertMessage: string | null;
  @Column({ type: 'varchar', nullable: true }) notes: string | null;
  @Column({ name: 'lab_name', type: 'varchar', nullable: true }) labName: string | null;
  @Column({ name: 'attachment_url', type: 'varchar', nullable: true }) attachmentUrl: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}

export { DST_TYPES };
