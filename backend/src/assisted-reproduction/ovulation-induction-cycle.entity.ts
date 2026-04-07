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
  TriggerType,
  OHSSGrade,
  OIIndication,
  OIProtocol,
  OICycleOutcome,
  AssistedReproductionAlert,
} from './assisted-reproduction.enums.js';

@Entity('ovulation_induction_cycles')
export class OvulationInductionCycle {
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

  @Column({ name: 'cycle_number', type: 'int' })
  cycleNumber: number;

  @Column({ name: 'cycle_start_date', type: 'date' })
  cycleStartDate: string;

  @Column({ type: 'enum', enum: OIIndication })
  indication: OIIndication;

  @Column({ type: 'enum', enum: OIProtocol })
  protocol: OIProtocol;

  @Column({ name: 'starting_dose', type: 'decimal', precision: 7, scale: 2 })
  startingDose: number;

  @Column({ name: 'starting_dose_unit', type: 'varchar' })
  startingDoseUnit: string;

  @Column({
    name: 'trigger_type',
    type: 'enum',
    enum: TriggerType,
    enumName: 'art_trigger_type_enum',
    nullable: true,
  })
  triggerType: TriggerType | null;

  @Column({ name: 'trigger_dose', type: 'decimal', precision: 7, scale: 2, nullable: true })
  triggerDose: number | null;

  @Column({ name: 'trigger_date', type: 'date', nullable: true })
  triggerDate: string | null;

  @Column({ name: 'trigger_time', type: 'varchar', nullable: true })
  triggerTime: string | null;

  @Column({ name: 'monitoring_visits', type: 'jsonb', nullable: true })
  monitoringVisits: Record<string, unknown>[] | null;

  @Column({ name: 'outcome_type', type: 'enum', enum: OICycleOutcome, nullable: true })
  outcomeType: OICycleOutcome | null;

  @Column({ name: 'follicles_at_trigger', type: 'int', nullable: true })
  folliclesAtTrigger: number | null;

  @Column({
    name: 'endometrial_thickness_at_trigger',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  endometrialThicknessAtTrigger: number | null;

  @Column({
    name: 'estradiol_at_trigger',
    type: 'decimal',
    precision: 7,
    scale: 1,
    nullable: true,
  })
  estradiolAtTrigger: number | null;

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

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'pregnancy_test', type: 'boolean', nullable: true })
  pregnancyTest: boolean | null;

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
