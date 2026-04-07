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
import {
  IVFCycleType,
  StimulationProtocol,
  TriggerType,
  FertilizationMethod,
  PGTType,
  TransferType,
  TechnicalDifficulty,
  OHSSGrade,
  AssistedReproductionAlert,
} from './assisted-reproduction.enums.js';

@Entity('ivf_cycles')
export class IvfCycle {
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

  @Column({ name: 'cycle_type', type: 'enum', enum: IVFCycleType })
  cycleType: IVFCycleType;

  @Column({ name: 'stimulation_protocol', type: 'enum', enum: StimulationProtocol })
  stimulationProtocol: StimulationProtocol;

  @Column({ name: 'stimulation_start_date', type: 'date', nullable: true })
  stimulationStartDate: string | null;

  // ── Estimulação ──
  @Column({ name: 'total_fsh_dose', type: 'decimal', precision: 8, scale: 2, nullable: true })
  totalFSHDose: number | null;

  @Column({ name: 'stimulation_days', type: 'int', nullable: true })
  stimulationDays: number | null;

  @Column({ name: 'peak_estradiol', type: 'decimal', precision: 8, scale: 1, nullable: true })
  peakEstradiol: number | null;

  @Column({
    name: 'trigger_type',
    type: 'enum',
    enum: TriggerType,
    enumName: 'art_trigger_type_enum',
    nullable: true,
  })
  triggerType: TriggerType | null;

  @Column({ name: 'trigger_date', type: 'date', nullable: true })
  triggerDate: string | null;

  // ── Captação ──
  @Column({ name: 'oocyte_retrieval_date', type: 'date', nullable: true })
  oocyteRetrievalDate: string | null;

  @Column({ name: 'total_oocytes_retrieved', type: 'int', nullable: true })
  totalOocytesRetrieved: number | null;

  @Column({ name: 'mii_oocytes', type: 'int', nullable: true })
  miiOocytes: number | null;

  @Column({ name: 'mi_oocytes', type: 'int', nullable: true })
  miOocytes: number | null;

  @Column({ name: 'gv_oocytes', type: 'int', nullable: true })
  gvOocytes: number | null;

  @Column({ type: 'int', nullable: true })
  atretic: number | null;

  // ── Fertilização ──
  @Column({ name: 'fertilization_method', type: 'enum', enum: FertilizationMethod })
  fertilizationMethod: FertilizationMethod;

  @Column({ name: 'fertilized_2pn', type: 'int', nullable: true })
  fertilized2PN: number | null;

  @Column({
    name: 'fertilization_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  fertilizationRate: number | null;

  // ── Desenvolvimento embrionário ──
  @Column({ name: 'day3_embryos', type: 'int', nullable: true })
  day3Embryos: number | null;

  @Column({ type: 'int', nullable: true })
  blastocysts: number | null;

  @Column({ name: 'blasto_grades', type: 'text', array: true, nullable: true })
  blastoGrades: string[] | null;

  // ── PGT ──
  @Column({ name: 'pgt_performed', type: 'boolean', default: false })
  pgtPerformed: boolean;

  @Column({ name: 'pgt_type', type: 'enum', enum: PGTType, nullable: true })
  pgtType: PGTType | null;

  @Column({ name: 'euploid_embryos', type: 'int', nullable: true })
  euploidEmbryos: number | null;

  // ── Criopreservação ──
  @Column({ name: 'cryopreserved_embryos', type: 'int', nullable: true })
  cryopreservedEmbryos: number | null;

  @Column({ name: 'cryopreservation_date', type: 'date', nullable: true })
  cryopreservationDate: string | null;

  // ── Transferência ──
  @Column({ name: 'transfer_date', type: 'date', nullable: true })
  transferDate: string | null;

  @Column({ name: 'embryos_transferred', type: 'int', nullable: true })
  embryosTransferred: number | null;

  @Column({
    name: 'embryo_grades_transferred',
    type: 'text',
    array: true,
    nullable: true,
  })
  embryoGradesTransferred: string[] | null;

  @Column({ name: 'transfer_type', type: 'enum', enum: TransferType, nullable: true })
  transferType: TransferType | null;

  @Column({
    name: 'endometrial_thickness_at_transfer',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  endometrialThicknessAtTransfer: number | null;

  @Column({ name: 'luteal_support_protocol', type: 'text', nullable: true })
  lutealSupportProtocol: string | null;

  @Column({
    name: 'technical_difficulty',
    type: 'enum',
    enum: TechnicalDifficulty,
    enumName: 'art_technical_difficulty_enum',
    nullable: true,
  })
  technicalDifficulty: TechnicalDifficulty | null;

  // ── Desfecho ──
  @Column({
    name: 'ovarian_hyperstimulation_syndrome',
    type: 'boolean',
    default: false,
  })
  ovarianHyperstimulationSyndrome: boolean;

  @Column({
    name: 'ohss_grade',
    type: 'enum',
    enum: OHSSGrade,
    enumName: 'art_ohss_grade_enum',
    nullable: true,
  })
  ohssGrade: OHSSGrade | null;

  @Column({ name: 'ohss_hospitalization', type: 'boolean', nullable: true })
  ohssHospitalization: boolean | null;

  @Column({ name: 'beta_hcg_date', type: 'date', nullable: true })
  betaHcgDate: string | null;

  @Column({ name: 'beta_hcg_value', type: 'decimal', precision: 10, scale: 2, nullable: true })
  betaHcgValue: number | null;

  @Column({ name: 'clinical_pregnancy', type: 'boolean', nullable: true })
  clinicalPregnancy: boolean | null;

  @Column({ name: 'live_birth', type: 'boolean', nullable: true })
  liveBirth: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  miscarriage: boolean | null;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason: string | null;

  @Column({ name: 'cumulative_embryos_in_storage', type: 'int', nullable: true })
  cumulativeEmbryosInStorage: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  alerts: AssistedReproductionAlert[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
