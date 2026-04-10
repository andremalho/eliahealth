import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { AgeGroup } from './research.enums.js';

@Entity('research_records')
export class ResearchRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'research_id', type: 'varchar', unique: true })
  researchId: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' })
  pregnancyId: string;

  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ name: 'maternal_age', type: 'int' })
  maternalAge: number;

  @Column({ name: 'age_group', type: 'enum', enum: AgeGroup })
  ageGroup: AgeGroup;

  @Column({ name: 'zip_code_partial', type: 'varchar', nullable: true })
  zipCodePartial: string | null;

  @Column({ type: 'varchar', nullable: true })
  region: string | null;

  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  @Column({ name: 'income_estimate', type: 'varchar', nullable: true })
  incomeEstimate: string | null;

  @Column({ type: 'varchar', nullable: true })
  neighborhood: string | null;

  @Column({ type: 'varchar', nullable: true })
  zone: string | null;

  @Column({ name: 'blood_type', type: 'varchar', nullable: true })
  bloodType: string | null;

  @Column({ type: 'int' })
  gravida: number;

  @Column({ type: 'int' })
  para: number;

  @Column({ type: 'int' })
  abortus: number;

  @Column({ type: 'int' })
  plurality: number;

  @Column({ type: 'varchar', nullable: true })
  chorionicity: string | null;

  @Column({ name: 'ga_at_delivery', type: 'int', nullable: true })
  gaAtDelivery: number | null;

  @Column({ name: 'delivery_type', type: 'varchar', nullable: true })
  deliveryType: string | null;

  @Column({ name: 'high_risk_flags', type: 'jsonb', default: [] })
  highRiskFlags: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bmi: number | null;

  @Column({ name: 'gestational_diabetes', type: 'boolean', default: false })
  gestationalDiabetes: boolean;

  @Column({ type: 'boolean', default: false })
  hypertension: boolean;

  @Column({ type: 'boolean', default: false })
  preeclampsia: boolean;

  @Column({ name: 'hellp_syndrome', type: 'boolean', default: false })
  hellpSyndrome: boolean;

  @Column({ type: 'boolean', default: false })
  fgr: boolean;

  @Column({ name: 'preterm_birth', type: 'boolean', default: false })
  pretermBirth: boolean;

  @Column({ name: 'trisomy_screening_result', type: 'jsonb', nullable: true })
  trisomyScreeningResult: Record<string, unknown> | null;

  @Column({ name: 'pe_screening_result', type: 'jsonb', nullable: true })
  peScreeningResult: Record<string, unknown> | null;

  @Column({ name: 'neonatal_data', type: 'jsonb', nullable: true })
  neonatalData: Record<string, unknown>[] | null;

  @Column({ name: 'lab_abnormalities', type: 'jsonb', nullable: true })
  labAbnormalities: Record<string, unknown> | null;

  @Column({ name: 'consent_for_research', type: 'boolean', default: false })
  consentForResearch: boolean;

  @Column({ name: 'data_version', type: 'varchar', default: '1.0' })
  dataVersion: string;

  // Hash of record data for tamper detection — verify integrity on read
  @Column({ name: 'data_hash', type: 'varchar', nullable: true })
  dataHash: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
