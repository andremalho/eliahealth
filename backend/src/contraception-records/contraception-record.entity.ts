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
  ContraceptiveMethod,
  ReproductiveDesire,
  WHOMECCategory,
  ContraceptionAlert,
} from './contraception-record.enums.js';
import { SmokingStatus } from '../gynecology-consultations/gynecology-consultation.enums.js';

@Entity('contraception_records')
export class ContraceptionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctorId: string | null;

  @Column({ name: 'consultation_date', type: 'date' })
  consultationDate: string;

  // ── Situação atual ──
  @Column({
    name: 'current_method',
    type: 'enum',
    enum: ContraceptiveMethod,
    default: ContraceptiveMethod.NONE,
  })
  currentMethod: ContraceptiveMethod;

  @Column({ name: 'current_method_start_date', type: 'date', nullable: true })
  currentMethodStartDate: string | null;

  @Column({ name: 'current_method_details', type: 'text', nullable: true })
  currentMethodDetails: string | null;

  // ── Histórico ──
  @Column({ name: 'previous_methods', type: 'jsonb', nullable: true })
  previousMethods: Record<string, unknown>[] | null;

  // ── Desejo reprodutivo ──
  @Column({ name: 'desire_for_pregnancy', type: 'enum', enum: ReproductiveDesire })
  desireForPregnancy: ReproductiveDesire;

  @Column({ type: 'boolean', default: false })
  breastfeeding: boolean;

  // ── Elegibilidade OMS ──
  @Column({
    name: 'whomec_category',
    type: 'enum',
    enum: WHOMECCategory,
    nullable: true,
  })
  whomecCategory: WHOMECCategory | null;

  @Column({ name: 'whomec_conditions', type: 'jsonb', nullable: true })
  whomecConditions: Record<string, unknown>[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  contraindications: string[] | null;

  // ── Fatores de risco ──
  @Column({
    name: 'smoking_status',
    type: 'enum',
    enum: SmokingStatus,
    enumName: 'smoking_status_enum',
    nullable: true,
  })
  smokingStatus: SmokingStatus | null;

  @Column({ name: 'smoking_age_35_plus', type: 'boolean', default: false })
  smokingAge35Plus: boolean;

  @Column({ name: 'history_of_vte', type: 'boolean', default: false })
  historyOfVTE: boolean;

  @Column({ type: 'boolean', default: false })
  thrombophilia: boolean;

  @Column({ name: 'thrombophilia_details', type: 'text', nullable: true })
  thrombophiliaDetails: string | null;

  @Column({ name: 'migraine_with_aura', type: 'boolean', default: false })
  migraineWithAura: boolean;

  @Column({ name: 'uncontrolled_hypertension', type: 'boolean', default: false })
  uncontrolledHypertension: boolean;

  @Column({ name: 'diabetes_with_15years_plus', type: 'boolean', default: false })
  diabetesWith15yearsPlus: boolean;

  @Column({ name: 'breast_cancer_history', type: 'boolean', default: false })
  breastCancerHistory: boolean;

  @Column({ name: 'liver_disease', type: 'boolean', default: false })
  liverDisease: boolean;

  @Column({ name: 'cardiovascular_disease', type: 'boolean', default: false })
  cardiovascularDisease: boolean;

  @Column({ type: 'boolean', default: false })
  stroke: boolean;

  // ── DIU ──
  @Column({ name: 'iud_insertion_date', type: 'date', nullable: true })
  iudInsertionDate: string | null;

  @Column({ name: 'iud_expiration_date', type: 'date', nullable: true })
  iudExpirationDate: string | null;

  @Column({ name: 'iud_position_ultrasound', type: 'text', nullable: true })
  iudPositionUltrasound: string | null;

  @Column({ name: 'iud_next_check_date', type: 'date', nullable: true })
  iudNextCheckDate: string | null;

  @Column({ name: 'iud_removal_date', type: 'date', nullable: true })
  iudRemovalDate: string | null;

  @Column({ name: 'iud_removal_reason', type: 'text', nullable: true })
  iudRemovalReason: string | null;

  // ── Implante ──
  @Column({ name: 'implant_insertion_date', type: 'date', nullable: true })
  implantInsertionDate: string | null;

  @Column({ name: 'implant_expiration_date', type: 'date', nullable: true })
  implantExpirationDate: string | null;

  @Column({ name: 'implant_location', type: 'text', nullable: true })
  implantLocation: string | null;

  @Column({ name: 'implant_removal_date', type: 'date', nullable: true })
  implantRemovalDate: string | null;

  // ── PAE ──
  @Column({ name: 'emergency_contraception_used', type: 'boolean', default: false })
  emergencyContraceptionUsed: boolean;

  @Column({ name: 'emergency_contraception_date', type: 'date', nullable: true })
  emergencyContraceptionDate: string | null;

  @Column({ name: 'emergency_contraception_method', type: 'varchar', nullable: true })
  emergencyContraceptionMethod: string | null;

  @Column({ name: 'emergency_contraception_reason', type: 'text', nullable: true })
  emergencyContraceptionReason: string | null;

  // ── Conduta ──
  @Column({
    name: 'method_prescribed',
    type: 'enum',
    enum: ContraceptiveMethod,
    nullable: true,
  })
  methodPrescribed: ContraceptiveMethod | null;

  @Column({ name: 'method_prescribed_details', type: 'text', nullable: true })
  methodPrescribedDetails: string | null;

  @Column({ name: 'counseling_provided', type: 'boolean', default: false })
  counselingProvided: boolean;

  @Column({ name: 'counseling_topics', type: 'text', array: true, nullable: true })
  counselingTopics: string[] | null;

  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ── Copiloto ──
  @Column({ type: 'jsonb', nullable: true })
  alerts: ContraceptionAlert[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
