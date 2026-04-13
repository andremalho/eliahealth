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
  GynecologyConsultationType,
  MenstrualVolume,
  DysmenorrheaGrade,
  SmokingStatus,
  PhysicalActivityLevel,
  EndometriosisStage,
  BiRads,
  AlcoholUsePattern,
  GynecologyAlert,
} from './gynecology-consultation.enums.js';

@Entity('gynecology_consultations')
export class GynecologyConsultation {
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

  @Column({
    name: 'consultation_type',
    type: 'enum',
    enum: GynecologyConsultationType,
    default: GynecologyConsultationType.ROUTINE,
  })
  consultationType: GynecologyConsultationType;

  // ── Anamnese ──
  @Column({ name: 'chief_complaint', type: 'varchar', nullable: true })
  chiefComplaint: string | null;

  @Column({ name: 'current_illness_history', type: 'text', nullable: true })
  currentIllnessHistory: string | null;

  @Column({ name: 'last_menstrual_period', type: 'date', nullable: true })
  lastMenstrualPeriod: string | null;

  @Column({ name: 'cycle_interval', type: 'int', nullable: true })
  cycleInterval: number | null;

  @Column({ name: 'cycle_duration', type: 'int', nullable: true })
  cycleDuration: number | null;

  @Column({ name: 'cycle_volume', type: 'enum', enum: MenstrualVolume, nullable: true })
  cycleVolume: MenstrualVolume | null;

  @Column({ type: 'enum', enum: DysmenorrheaGrade, nullable: true })
  dysmenorrhea: DysmenorrheaGrade | null;

  @Column({ name: 'last_pap_smear', type: 'date', nullable: true })
  lastPapSmear: string | null;

  @Column({ name: 'last_pap_smear_result', type: 'varchar', nullable: true })
  lastPapSmearResult: string | null;

  @Column({ name: 'pap_smear_attachment_url', type: 'text', nullable: true })
  papSmearAttachmentUrl: string | null;

  @Column({ name: 'pap_smear_attachment_name', type: 'text', nullable: true })
  papSmearAttachmentName: string | null;

  @Column({ name: 'pap_smear_attachment_mime_type', type: 'text', nullable: true })
  papSmearAttachmentMimeType: string | null;

  @Column({ name: 'last_mammography', type: 'date', nullable: true })
  lastMammography: string | null;

  @Column({ name: 'last_mammography_result', type: 'varchar', nullable: true })
  lastMammographyResult: string | null;

  @Column({ name: 'mammography_attachment_url', type: 'text', nullable: true })
  mammographyAttachmentUrl: string | null;

  @Column({ name: 'mammography_attachment_name', type: 'text', nullable: true })
  mammographyAttachmentName: string | null;

  @Column({ name: 'mammography_attachment_mime_type', type: 'text', nullable: true })
  mammographyAttachmentMimeType: string | null;

  @Column({ name: 'contraceptive_method', type: 'varchar', nullable: true })
  contraceptiveMethod: string | null;

  @Column({ name: 'sexually_active', type: 'boolean', nullable: true })
  sexuallyActive: boolean | null;

  @Column({ name: 'number_of_sexual_partners', type: 'int', nullable: true })
  numberOfSexualPartners: number | null;

  @Column({ name: 'history_of_sti', type: 'boolean', nullable: true })
  historyOfSTI: boolean | null;

  @Column({ name: 'history_of_sti_details', type: 'text', nullable: true })
  historyOfSTIDetails: string | null;

  @Column({ name: 'smoking_status', type: 'enum', enum: SmokingStatus, nullable: true })
  smokingStatus: SmokingStatus | null;

  @Column({ name: 'smoking_packs_per_year', type: 'decimal', precision: 5, scale: 2, nullable: true })
  smokingPacksPerYear: number | null;

  @Column({ name: 'alcohol_use', type: 'boolean', nullable: true })
  alcoholUse: boolean | null;

  @Column({
    name: 'alcohol_use_pattern',
    type: 'enum',
    enum: AlcoholUsePattern,
    nullable: true,
  })
  alcoholUsePattern: AlcoholUsePattern | null;

  @Column({ name: 'drug_use', type: 'boolean', nullable: true })
  drugUse: boolean | null;

  @Column({ name: 'drug_use_details', type: 'text', nullable: true })
  drugUseDetails: string | null;

  @Column({ name: 'physical_activity', type: 'enum', enum: PhysicalActivityLevel, nullable: true })
  physicalActivity: PhysicalActivityLevel | null;

  // ── Antecedentes ginecológicos ──
  @Column({ name: 'previous_gynecologic_surgeries', type: 'text', nullable: true })
  previousGynecologicSurgeries: string | null;

  @Column({ name: 'history_of_endometriosis', type: 'boolean', nullable: true })
  historyOfEndometriosis: boolean | null;

  @Column({ name: 'endometriosis_stage', type: 'enum', enum: EndometriosisStage, nullable: true })
  endometriosisStage: EndometriosisStage | null;

  @Column({ name: 'history_of_myoma', type: 'boolean', nullable: true })
  historyOfMyoma: boolean | null;

  @Column({ name: 'history_of_ovarian_cyst', type: 'boolean', nullable: true })
  historyOfOvarianCyst: boolean | null;

  @Column({ name: 'history_of_pcos', type: 'boolean', nullable: true })
  historyOfPCOS: boolean | null;

  @Column({ name: 'history_of_hpv', type: 'boolean', nullable: true })
  historyOfHPV: boolean | null;

  @Column({ name: 'history_of_cervical_dysplasia', type: 'boolean', nullable: true })
  historyOfCervicalDysplasia: boolean | null;

  // ── Antecedentes obstétricos (resumo) ──
  @Column({ type: 'int', nullable: true })
  gravida: number | null;

  @Column({ type: 'int', nullable: true })
  para: number | null;

  @Column({ type: 'int', nullable: true })
  abortus: number | null;

  @Column({ type: 'int', nullable: true })
  cesarean: number | null;

  // ── Antecedentes familiares ──
  @Column({ name: 'family_history_breast_cancer', type: 'boolean', nullable: true })
  familyHistoryBreastCancer: boolean | null;

  @Column({ name: 'family_history_ovarian_cancer', type: 'boolean', nullable: true })
  familyHistoryOvarianCancer: boolean | null;

  @Column({ name: 'family_history_endometrial_cancer', type: 'boolean', nullable: true })
  familyHistoryEndometrialCancer: boolean | null;

  @Column({ name: 'family_history_colorectal_cancer', type: 'boolean', nullable: true })
  familyHistoryColorectalCancer: boolean | null;

  @Column({ name: 'family_history_diabetes', type: 'boolean', nullable: true })
  familyHistoryDiabetes: boolean | null;

  @Column({ name: 'family_history_cardiovascular_disease', type: 'boolean', nullable: true })
  familyHistoryCardiovascularDisease: boolean | null;

  @Column({ name: 'family_history_thrombosis', type: 'boolean', nullable: true })
  familyHistoryThrombosis: boolean | null;

  @Column({ name: 'family_history_details', type: 'text', nullable: true })
  familyHistoryDetails: string | null;

  @Column({ name: 'family_history_osteoporosis', type: 'boolean', nullable: true })
  familyHistoryOsteoporosis: boolean | null;

  @Column({ name: 'family_history_hypertension', type: 'boolean', nullable: true })
  familyHistoryHypertension: boolean | null;

  // ── Saúde mental ──
  @Column({ name: 'phq2_score', type: 'int', nullable: true })
  phq2Score: number | null;

  @Column({ name: 'gad2_score', type: 'int', nullable: true })
  gad2Score: number | null;

  @Column({ name: 'mental_health_notes', type: 'text', nullable: true })
  mentalHealthNotes: string | null;

  // ── Exame físico ──
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bmi: number | null;

  @Column({ name: 'waist_circumference', type: 'decimal', precision: 5, scale: 2, nullable: true })
  waistCircumference: number | null;

  @Column({ name: 'blood_pressure_systolic', type: 'int', nullable: true })
  bloodPressureSystolic: number | null;

  @Column({ name: 'blood_pressure_diastolic', type: 'int', nullable: true })
  bloodPressureDiastolic: number | null;

  @Column({ name: 'heart_rate', type: 'int', nullable: true })
  heartRate: number | null;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number | null;

  @Column({ name: 'thyroid_exam', type: 'text', nullable: true })
  thyroidExam: string | null;

  @Column({ name: 'lymph_node_exam', type: 'text', nullable: true })
  lymphNodeExam: string | null;

  @Column({ name: 'signs_of_hyperandrogenism', type: 'boolean', nullable: true })
  signsOfHyperandrogenism: boolean | null;

  @Column({ name: 'hyperandrogenism_details', type: 'text', nullable: true })
  hyperandrogenismDetails: string | null;

  // ── Exame mamário ──
  @Column({ name: 'breast_exam_performed', type: 'boolean', default: false })
  breastExamPerformed: boolean;

  @Column({ name: 'breast_exam_normal', type: 'boolean', nullable: true })
  breastExamNormal: boolean | null;

  @Column({ name: 'breast_exam_findings', type: 'text', nullable: true })
  breastExamFindings: string | null;

  @Column({ name: 'birads_classification', type: 'enum', enum: BiRads, nullable: true })
  biradsClassification: BiRads | null;

  // ── Exame ginecológico ──
  @Column({ name: 'pelvic_exam_performed', type: 'boolean', default: false })
  pelvicExamPerformed: boolean;

  @Column({ name: 'vulvar_exam_normal', type: 'boolean', nullable: true })
  vulvarExamNormal: boolean | null;

  @Column({ name: 'vulvar_findings', type: 'text', nullable: true })
  vulvarFindings: string | null;

  @Column({ name: 'speculoscopy_performed', type: 'boolean', nullable: true })
  speculoscopyPerformed: boolean | null;

  @Column({ name: 'cervix_appearance', type: 'text', nullable: true })
  cervixAppearance: string | null;

  @Column({ name: 'pap_smear_collected', type: 'boolean', nullable: true })
  papSmearCollected: boolean | null;

  @Column({ name: 'bimanual_exam_normal', type: 'boolean', nullable: true })
  bimanualExamNormal: boolean | null;

  @Column({ name: 'uterine_size', type: 'text', nullable: true })
  uterineSize: string | null;

  @Column({ name: 'adnexal_findings', type: 'text', nullable: true })
  adnexalFindings: string | null;

  @Column({ name: 'pelvic_floor_assessment', type: 'text', nullable: true })
  pelvicFloorAssessment: string | null;

  // ── Rastreamento oncológico realizado ──
  @Column({ name: 'cancer_screening_performed', type: 'jsonb', nullable: true })
  cancerScreeningPerformed: Record<string, unknown> | null;

  // ── Conduta ──
  @Column({ type: 'text', nullable: true })
  diagnosis: string | null;

  @Column({ name: 'icd10_codes', type: 'text', array: true, nullable: true })
  icd10Codes: string[] | null;

  @Column({ name: 'requested_exams', type: 'jsonb', nullable: true })
  requestedExams: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  prescriptions: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  referrals: string | null;

  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes: string | null;

  // ── Dados da avaliacao inicial (jsonb livre para campos da 1a consulta) ──
  @Column({ name: 'initial_assessment_data', type: 'jsonb', nullable: true })
  initialAssessmentData: Record<string, unknown> | null;

  // ── Copiloto: alertas estruturados ──
  @Column({ type: 'jsonb', nullable: true })
  alerts: GynecologyAlert[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
