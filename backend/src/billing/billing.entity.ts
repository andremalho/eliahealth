import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity.js';

export enum BillingStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  DENIED = 'denied',
  APPEALED = 'appealed',
  PAID = 'paid',
}

export enum GuideType {
  SADT = 'sadt',
  CONSULTATION = 'consultation',
  HOSPITALIZATION = 'hospitalization',
  HONOR = 'honor',
}

@Entity('billing_records')
export class BillingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'guide_type', type: 'enum', enum: GuideType })
  guideType: GuideType;

  @Column({ name: 'guide_number', type: 'varchar', nullable: true })
  guideNumber: string | null;

  @Column({ type: 'enum', enum: BillingStatus, default: BillingStatus.DRAFT })
  status: BillingStatus;

  // Convênio
  @Column({ name: 'insurance_provider', type: 'varchar', nullable: true })
  insuranceProvider: string | null;

  @Column({ name: 'insurance_member_id', type: 'varchar', nullable: true })
  insuranceMemberId: string | null;

  @Column({ name: 'authorization_number', type: 'varchar', nullable: true })
  authorizationNumber: string | null;

  // Procedimentos TUSS
  @Column({ type: 'jsonb', default: [] })
  procedures: {
    tussCode: string;
    description: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
  }[];

  @Column({ name: 'total_value', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalValue: number;

  // Datas
  @Column({ name: 'service_date', type: 'date' })
  serviceDate: string;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'paid_value', type: 'decimal', precision: 10, scale: 2, nullable: true })
  paidValue: number | null;

  @Column({ name: 'denial_reason', type: 'text', nullable: true })
  denialReason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // TISS XML
  @Column({ name: 'tiss_xml', type: 'text', nullable: true })
  tissXml: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
