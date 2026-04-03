import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { Consultation } from '../consultations/consultation.entity.js';
import { User } from '../auth/user.entity.js';

export enum PrescriptionStatus { ACTIVE = 'active', COMPLETED = 'completed', CANCELLED = 'cancelled' }

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' }) pregnancyId: string;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'consultation_id', type: 'uuid', nullable: true }) consultationId: string | null;
  @ManyToOne(() => Consultation, { onDelete: 'SET NULL', nullable: true }) @JoinColumn({ name: 'consultation_id' }) consultation: Consultation | null;

  @Column({ name: 'prescribed_by', type: 'uuid' }) prescribedBy: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'prescribed_by' }) prescriber: User;

  @Column({ name: 'prescription_date', type: 'date' }) prescriptionDate: string;
  @Column({ type: 'jsonb', default: [] }) medications: Record<string, unknown>[];
  @Column({ type: 'enum', enum: PrescriptionStatus, default: PrescriptionStatus.ACTIVE }) status: PrescriptionStatus;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ name: 'digital_signature', type: 'varchar', nullable: true }) digitalSignature: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
