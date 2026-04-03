import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { Consultation } from '../consultations/consultation.entity.js';
import { User } from '../auth/user.entity.js';

export enum PrescriptionStatus { ACTIVE = 'active', COMPLETED = 'completed', CANCELLED = 'cancelled' }
export enum ExternalProvider { MEMED = 'memed', INTERNAL = 'internal' }
export enum DigitalSignatureProvider { BIRD_ID = 'bird_id', CERTISIGN = 'certisign', VALID = 'valid' }

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

  // INTEGRATION: Memed — use widget Memed (https://developers.memed.com.br)
  @Column({ name: 'external_prescription_id', type: 'varchar', nullable: true }) externalPrescriptionId: string | null;
  @Column({ name: 'external_provider', type: 'enum', enum: ExternalProvider, default: ExternalProvider.INTERNAL }) externalProvider: ExternalProvider;

  // DIGITAL SIGNATURE: Bird ID API (https://www.birdid.com.br/developer)
  @Column({ name: 'digital_signature_id', type: 'varchar', nullable: true }) digitalSignatureId: string | null;
  @Column({ name: 'digital_signature_provider', type: 'enum', enum: DigitalSignatureProvider, nullable: true }) digitalSignatureProvider: DigitalSignatureProvider | null;
  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true }) signedAt: Date | null;
  @Column({ name: 'signed_document_url', type: 'varchar', nullable: true }) signedDocumentUrl: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
