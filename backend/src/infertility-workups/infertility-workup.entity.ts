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
  InfertilityDefinition,
  OvulatoryStatus,
  WHOOvulationGroup,
  InfertilityDiagnosis,
  FertilityPreservationIndication,
  InfertilityTreatment,
  InfertilityAlert,
} from './infertility-workup.enums.js';

@Entity('infertility_workups')
export class InfertilityWorkup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  // Parceiro pode ser opcional e também ser paciente da clínica
  @Column({ name: 'partner_id', type: 'uuid', nullable: true })
  partnerId: string | null;

  @ManyToOne(() => Patient, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'partner_id' })
  partner: Patient | null;

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctorId: string | null;

  @Column({ name: 'workup_date', type: 'date' })
  workupDate: string;

  // ── Definição do caso (ACOG CO 781) ──
  @Column({
    name: 'infertility_definition',
    type: 'enum',
    enum: InfertilityDefinition,
  })
  infertilityDefinition: InfertilityDefinition;

  @Column({ name: 'duration_months', type: 'int' })
  durationMonths: number;

  @Column({ name: 'age_at_presentation', type: 'int' })
  ageAtPresentation: number;

  @Column({ name: 'expedited_evaluation', type: 'boolean', default: false })
  expeditedEvaluation: boolean;

  @Column({ name: 'immediate_evaluation', type: 'boolean', default: false })
  immediateEvaluation: boolean;

  // ── Fator ovulatório ──
  @Column({ name: 'ovulatory_factor', type: 'boolean', nullable: true })
  ovulatoryFactor: boolean | null;

  @Column({
    name: 'ovulatory_status',
    type: 'enum',
    enum: OvulatoryStatus,
    nullable: true,
  })
  ovulatoryStatus: OvulatoryStatus | null;

  @Column({
    name: 'who_group_ovulation',
    type: 'enum',
    enum: WHOOvulationGroup,
    nullable: true,
  })
  whoGroupOvulation: WHOOvulationGroup | null;

  // ── Reserva ovariana ──
  @Column({ name: 'ovarian_reserve', type: 'jsonb', nullable: true })
  ovarianReserve: Record<string, unknown> | null;

  // ── Fator tubário / uterino ──
  @Column({ name: 'tubal_factor', type: 'boolean', nullable: true })
  tubalFactor: boolean | null;

  @Column({ type: 'jsonb', nullable: true })
  hsg: Record<string, unknown> | null;

  @Column({ name: 'hycosy', type: 'jsonb', nullable: true })
  hyCoSy: Record<string, unknown> | null;

  @Column({ name: 'diagnostic_hysteroscopy', type: 'jsonb', nullable: true })
  diagnosticHysteroscopy: Record<string, unknown> | null;

  @Column({ name: 'pelvic_mri', type: 'jsonb', nullable: true })
  pelvicMRI: Record<string, unknown> | null;

  @Column({ name: 'laparoscopy_diagnostic', type: 'jsonb', nullable: true })
  laparoscopyDiagnostic: Record<string, unknown> | null;

  @Column({ name: 'mullerian_anomaly', type: 'boolean', default: false })
  mullerianAnomaly: boolean;

  @Column({ name: 'mullerian_anomaly_type', type: 'text', nullable: true })
  mullerianAnomalyType: string | null;

  // ── Fator masculino ──
  @Column({ name: 'male_factor', type: 'boolean', nullable: true })
  maleFactor: boolean | null;

  @Column({ name: 'semen_analysis', type: 'jsonb', nullable: true })
  semenAnalysis: Record<string, unknown> | null;

  @Column({ name: 'dna_fragmentation', type: 'jsonb', nullable: true })
  dnaFragmentation: Record<string, unknown> | null;

  @Column({
    name: 'male_fertility_specialist_referral',
    type: 'boolean',
    default: false,
  })
  maleFertilitySpecialistReferral: boolean;

  // ── Diagnóstico final ──
  @Column({
    name: 'primary_diagnosis',
    type: 'enum',
    enum: InfertilityDiagnosis,
    nullable: true,
  })
  primaryDiagnosis: InfertilityDiagnosis | null;

  @Column({
    name: 'secondary_diagnoses',
    type: 'text',
    array: true,
    nullable: true,
  })
  secondaryDiagnoses: string[] | null;

  // ── Preservação da fertilidade ──
  @Column({ name: 'fertility_preservation', type: 'boolean', default: false })
  fertilityPreservation: boolean;

  @Column({
    name: 'preservation_indication',
    type: 'enum',
    enum: FertilityPreservationIndication,
    nullable: true,
  })
  preservationIndication: FertilityPreservationIndication | null;

  @Column({ name: 'preservation_method', type: 'text', nullable: true })
  preservationMethod: string | null;

  @Column({ name: 'preservation_date', type: 'date', nullable: true })
  preservationDate: string | null;

  @Column({ name: 'preservation_details', type: 'text', nullable: true })
  preservationDetails: string | null;

  // ── Plano de tratamento ──
  @Column({
    name: 'treatment_plan',
    type: 'enum',
    enum: InfertilityTreatment,
    nullable: true,
  })
  treatmentPlan: InfertilityTreatment | null;

  @Column({ name: 'referral_to_art', type: 'boolean', default: false })
  referralToART: boolean;

  @Column({ name: 'art_clinic_name', type: 'text', nullable: true })
  artClinicName: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: string | null;

  // ── Copiloto ──
  @Column({ type: 'jsonb', nullable: true })
  alerts: InfertilityAlert[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
