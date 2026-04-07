import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity.js';
import { OvulationInductionCycle } from './ovulation-induction-cycle.entity.js';
import {
  IUIIndication,
  SpermPrep,
  SpermSource,
  TechnicalDifficulty,
  AssistedReproductionAlert,
} from './assisted-reproduction.enums.js';

@Entity('iui_cycles')
export class IuiCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'partner_id', type: 'uuid', nullable: true })
  partnerId: string | null;

  @ManyToOne(() => Patient, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'partner_id' })
  partner: Patient | null;

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctorId: string | null;

  @Column({ name: 'cycle_number', type: 'int' })
  cycleNumber: number;

  @Column({ name: 'iui_date', type: 'date' })
  iuiDate: string;

  @Column({ type: 'enum', enum: IUIIndication })
  indication: IUIIndication;

  @Column({ name: 'sperm_preparation_method', type: 'enum', enum: SpermPrep })
  spermPreparationMethod: SpermPrep;

  @Column({ name: 'sperm_source', type: 'enum', enum: SpermSource })
  spermSource: SpermSource;

  @Column({ name: 'donor_id', type: 'varchar', nullable: true })
  donorId: string | null;

  @Column({
    name: 'post_wash_concentration',
    type: 'decimal',
    precision: 7,
    scale: 2,
    nullable: true,
  })
  postWashConcentration: number | null;

  @Column({
    name: 'post_wash_total_motile',
    type: 'decimal',
    precision: 7,
    scale: 2,
    nullable: true,
  })
  postWashTotalMotile: number | null;

  @Column({
    name: 'post_wash_progressive_motility',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  postWashProgressiveMotility: number | null;

  @Column({ name: 'catheter_type', type: 'varchar', nullable: true })
  catheterType: string | null;

  @Column({
    name: 'technical_difficulty',
    type: 'enum',
    enum: TechnicalDifficulty,
    enumName: 'art_technical_difficulty_enum',
    nullable: true,
  })
  technicalDifficulty: TechnicalDifficulty | null;

  @Column({ name: 'oi_cycle_id', type: 'uuid', nullable: true })
  oiCycleId: string | null;

  @ManyToOne(() => OvulationInductionCycle, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'oi_cycle_id' })
  oiCycle: OvulationInductionCycle | null;

  @Column({ name: 'luteral_support', type: 'boolean', default: false })
  luteralSupport: boolean;

  @Column({ name: 'luteral_support_protocol', type: 'text', nullable: true })
  luteralSupportProtocol: string | null;

  @Column({ name: 'pregnancy_test_date', type: 'date', nullable: true })
  pregnancyTestDate: string | null;

  @Column({ name: 'beta_hcg_value', type: 'decimal', precision: 10, scale: 2, nullable: true })
  betaHcgValue: number | null;

  @Column({ name: 'clinical_pregnancy', type: 'boolean', nullable: true })
  clinicalPregnancy: boolean | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  alerts: AssistedReproductionAlert[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
