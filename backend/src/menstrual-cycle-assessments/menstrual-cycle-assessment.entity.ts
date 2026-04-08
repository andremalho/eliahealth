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
  MenstrualComplaint,
  LeiomyomaFIGO,
  MenstrualCycleAlert,
  PcosRotterdamCriteria,
} from './menstrual-cycle-assessment.enums.js';
import { EndometriosisStage } from '../gynecology-consultations/gynecology-consultation.enums.js';

@Entity('menstrual_cycle_assessments')
export class MenstrualCycleAssessment {
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

  @Column({ name: 'assessment_date', type: 'date' })
  assessmentDate: string;

  // ── Queixa principal ──
  @Column({ name: 'chief_complaint', type: 'enum', enum: MenstrualComplaint })
  chiefComplaint: MenstrualComplaint;

  // ── Caracterização do ciclo ──
  @Column({ name: 'cycle_interval_days', type: 'int', nullable: true })
  cycleIntervalDays: number | null;

  @Column({ name: 'cycle_duration_days', type: 'int', nullable: true })
  cycleDurationDays: number | null;

  @Column({ name: 'last_menstrual_period', type: 'date', nullable: true })
  lastMenstrualPeriod: string | null;

  @Column({ name: 'estimated_blood_volume_ml', type: 'int', nullable: true })
  estimatedBloodVolumeMl: number | null;

  @Column({ name: 'pictorial_blood_chart', type: 'int', nullable: true })
  pictorialBloodChart: number | null;

  @Column({ name: 'number_of_pads_per_day', type: 'int', nullable: true })
  numberOfPadsPerDay: number | null;

  // ── PALM (estrutural) ──
  @Column({ name: 'palm_polyp', type: 'boolean', default: false })
  palmPolyp: boolean;

  @Column({ name: 'palm_adenomyosis', type: 'boolean', default: false })
  palmAdenomyosis: boolean;

  @Column({ name: 'palm_leiomyoma', type: 'boolean', default: false })
  palmLeiomyoma: boolean;

  @Column({
    name: 'palm_leiomyoma_location',
    type: 'enum',
    enum: LeiomyomaFIGO,
    nullable: true,
  })
  palmLeiomyomaLocation: LeiomyomaFIGO | null;

  @Column({
    name: 'palm_malignancy_or_hyperplasia',
    type: 'boolean',
    default: false,
  })
  palmMalignancyOrHyperplasia: boolean;

  @Column({ name: 'palm_malignancy_details', type: 'text', nullable: true })
  palmMalignancyDetails: string | null;

  // ── COEIN (não-estrutural) ──
  @Column({ name: 'coein_coagulopathy', type: 'boolean', default: false })
  coeinCoagulopathy: boolean;

  @Column({ name: 'coein_coagulopathy_type', type: 'varchar', nullable: true })
  coeinCoagulopathyType: string | null;

  @Column({ name: 'coein_ovulatory_dysfunction', type: 'boolean', default: false })
  coeinOvulatoryDysfunction: boolean;

  @Column({ name: 'coein_ovulatory_type', type: 'varchar', nullable: true })
  coeinOvulatoryType: string | null;

  @Column({ name: 'coein_endometrial', type: 'boolean', default: false })
  coeinEndometrial: boolean;

  @Column({ name: 'coein_iatrogenic', type: 'boolean', default: false })
  coeinIatrogenic: boolean;

  @Column({ name: 'coein_iatrogenic_details', type: 'varchar', nullable: true })
  coeinIatrogenicDetails: string | null;

  @Column({ name: 'coein_not_yet_classified', type: 'boolean', default: false })
  coeinNotYetClassified: boolean;

  // ── Diagnósticos específicos ──
  @Column({ name: 'pcos_diagnosis', type: 'boolean', default: false })
  pcosDiagnosis: boolean;

  @Column({ name: 'pcos_rotterdam_criteria', type: 'jsonb', nullable: true })
  pcosRotterdamCriteria: PcosRotterdamCriteria | null;

  @Column({ name: 'pcos_homa_ir', type: 'decimal', precision: 5, scale: 2, nullable: true })
  pcosHomaIr: number | null;

  @Column({ name: 'pcos_metabolic_risk', type: 'text', nullable: true })
  pcosMetabolicRisk: string | null;

  @Column({ name: 'endometriosis_diagnosis', type: 'boolean', default: false })
  endometriosisDiagnosis: boolean;

  // Reusa o postgres type já criado pela migration de gynecology_consultations
  @Column({
    name: 'endometriosis_stage',
    type: 'enum',
    enum: EndometriosisStage,
    enumName: 'endometriosis_stage_enum',
    nullable: true,
  })
  endometriosisStage: EndometriosisStage | null;

  @Column({
    name: 'endometriosis_location',
    type: 'text',
    array: true,
    nullable: true,
  })
  endometriosisLocation: string[] | null;

  // ── Exames laboratoriais (estruturado livre) ──
  @Column({ type: 'jsonb', nullable: true })
  labs: Record<string, unknown> | null;

  // ── Imagem ──
  @Column({ name: 'transvaginal_ultrasound', type: 'jsonb', nullable: true })
  transvaginalUltrasound: Record<string, unknown> | null;

  @Column({ name: 'pelvic_mri', type: 'jsonb', nullable: true })
  pelvicMRI: Record<string, unknown> | null;

  // ── Conduta ──
  @Column({ type: 'text', nullable: true })
  diagnosis: string | null;

  @Column({ name: 'icd10_codes', type: 'text', array: true, nullable: true })
  icd10Codes: string[] | null;

  @Column({ name: 'treatment_plan', type: 'text', nullable: true })
  treatmentPlan: string | null;

  @Column({ name: 'medication_prescribed', type: 'jsonb', nullable: true })
  medicationPrescribed: Record<string, unknown> | null;

  @Column({ name: 'surgical_referral', type: 'boolean', default: false })
  surgicalReferral: boolean;

  @Column({ name: 'surgical_details', type: 'text', nullable: true })
  surgicalDetails: string | null;

  @Column({ name: 'hysteroscopy_performed', type: 'boolean', default: false })
  hysteroscopyPerformed: boolean;

  @Column({ name: 'hysteroscopy_date', type: 'date', nullable: true })
  hysteroscopyDate: string | null;

  @Column({ name: 'hysteroscopy_findings', type: 'text', nullable: true })
  hysteroscopyFindings: string | null;

  // Lista estruturada — substitui os 3 campos legacy acima.
  // Cada entrada: { date, findings, conduct }
  @Column({ type: 'jsonb', nullable: true })
  hysteroscopies: Record<string, unknown>[] | null;

  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ── Copiloto ──
  @Column({ type: 'jsonb', nullable: true })
  alerts: MenstrualCycleAlert[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
