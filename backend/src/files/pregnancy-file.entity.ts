import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { User } from '../auth/user.entity.js';

export enum PregnancyFileType { EXAM = 'exam', ULTRASOUND = 'ultrasound', PRESCRIPTION = 'prescription', REFERRAL = 'referral', REPORT = 'report', OTHER = 'other' }

@Entity('pregnancy_files')
export class PregnancyFile {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' }) pregnancyId: string;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'uploaded_by', type: 'uuid' }) uploadedBy: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'uploaded_by' }) uploader: User;

  @Column({ name: 'file_name', type: 'varchar' }) fileName: string;
  @Column({ name: 'file_type', type: 'enum', enum: PregnancyFileType }) fileType: PregnancyFileType;
  @Column({ name: 'mime_type', type: 'varchar' }) mimeType: string;
  @Column({ name: 'file_size', type: 'int' }) fileSize: number;
  @Column({ name: 'file_url', type: 'varchar' }) fileUrl: string;
  @Column({ type: 'varchar', nullable: true }) description: string | null;
  @Column({ name: 'is_visible_to_patient', type: 'boolean', default: false }) isVisibleToPatient: boolean;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
