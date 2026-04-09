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
  STRAWStage,
  MenopauseType,
  HotFlashIntensity,
  OsteoporosisClassification,
  CardioRisk,
  HRTScheme,
  EstrogenRoute,
  MenopauseAlert,
} from './menopause-assessment.enums.js';

@Entity('menopause_assessments')
export class MenopauseAssessment {
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

  // ── Estadiamento STRAW+10 ──
  @Column({ name: 'straw_stage', type: 'enum', enum: STRAWStage })
  strawStage: STRAWStage;

  @Column({ name: 'menopause_date', type: 'date', nullable: true })
  menopauseDate: string | null;

  @Column({ name: 'menopause_type', type: 'enum', enum: MenopauseType })
  menopauseType: MenopauseType;

  @Column({ name: 'age_at_menopause', type: 'int', nullable: true })
  ageAtMenopause: number | null;

  // ── MRS — Menopause Rating Scale (11 itens, 0-4 cada) ──
  // Domínio somato-vegetativo
  @Column({ name: 'mrs_hot_flashes', type: 'int', nullable: true })
  mrsHotFlashes: number | null;

  @Column({ name: 'mrs_heart_palpitations', type: 'int', nullable: true })
  mrsHeartPalpitations: number | null;

  @Column({ name: 'mrs_sleep_disorders', type: 'int', nullable: true })
  mrsSleepDisorders: number | null;

  @Column({ name: 'mrs_joint_muscle_discomfort', type: 'int', nullable: true })
  mrsJointMuscleDiscomfort: number | null;

  // Domínio psicológico
  @Column({ name: 'mrs_depressive_mood', type: 'int', nullable: true })
  mrsDepressiveMood: number | null;

  @Column({ name: 'mrs_irritability', type: 'int', nullable: true })
  mrsIrritability: number | null;

  @Column({ name: 'mrs_anxiety', type: 'int', nullable: true })
  mrsAnxiety: number | null;

  @Column({ name: 'mrs_physical_mental_exhaustion', type: 'int', nullable: true })
  mrsPhysicalMentalExhaustion: number | null;

  // Domínio urogenital
  @Column({ name: 'mrs_sexual_problems', type: 'int', nullable: true })
  mrsSexualProblems: number | null;

  @Column({ name: 'mrs_bladder_problems', type: 'int', nullable: true })
  mrsBladderProblems: number | null;

  @Column({ name: 'mrs_dryness_vagina', type: 'int', nullable: true })
  mrsDrynessVagina: number | null;

  @Column({ name: 'mrs_total_score', type: 'int', nullable: true })
  mrsTotalScore: number | null;

  // ── Frequência de fogachos ──
  @Column({ name: 'hot_flashes_per_day', type: 'int', nullable: true })
  hotFlashesPerDay: number | null;

  @Column({ name: 'hot_flashes_per_night', type: 'int', nullable: true })
  hotFlashesPerNight: number | null;

  @Column({
    name: 'hot_flash_intensity',
    type: 'enum',
    enum: HotFlashIntensity,
    nullable: true,
  })
  hotFlashIntensity: HotFlashIntensity | null;

  // ── GSM ──
  @Column({ name: 'gsm_diagnosis', type: 'boolean', default: false })
  gsmDiagnosis: boolean;

  @Column({ name: 'gsm_vaginal_dryness', type: 'boolean', nullable: true })
  gsmVaginalDryness: boolean | null;

  @Column({ name: 'gsm_dyspareunia', type: 'boolean', nullable: true })
  gsmDyspareunia: boolean | null;

  @Column({ name: 'gsm_recurrent_uti', type: 'boolean', nullable: true })
  gsmRecurrentUTI: boolean | null;

  @Column({ name: 'gsm_urinary_incontinence', type: 'boolean', nullable: true })
  gsmUrinaryIncontinence: boolean | null;

  @Column({ name: 'gsm_vulvar_atrophy', type: 'boolean', nullable: true })
  gsmVulvarAtrophy: boolean | null;

  @Column({ name: 'ph_meter_result', type: 'decimal', precision: 3, scale: 1, nullable: true })
  phMeterResult: number | null;

  // ── Saúde óssea ──
  @Column({ name: 'dexa_lumbar_t_score', type: 'decimal', precision: 4, scale: 2, nullable: true })
  dexaLumbarTScore: number | null;

  @Column({ name: 'dexa_femoral_neck_t_score', type: 'decimal', precision: 4, scale: 2, nullable: true })
  dexaFemoralNeckTScore: number | null;

  @Column({ name: 'dexa_total_hip_t_score', type: 'decimal', precision: 4, scale: 2, nullable: true })
  dexaTotalHipTScore: number | null;

  @Column({ name: 'dexa_date', type: 'date', nullable: true })
  dexaDate: string | null;

  @Column({ name: 'dexa_attachment_url', type: 'text', nullable: true })
  dexaAttachmentUrl: string | null;

  @Column({ name: 'dexa_attachment_name', type: 'text', nullable: true })
  dexaAttachmentName: string | null;

  @Column({ name: 'dexa_attachment_mime_type', type: 'text', nullable: true })
  dexaAttachmentMimeType: string | null;

  @Column({
    name: 'osteoporosis_classification',
    type: 'enum',
    enum: OsteoporosisClassification,
    nullable: true,
  })
  osteoporosisClassification: OsteoporosisClassification | null;

  @Column({ name: 'frax_score_10yr_major', type: 'decimal', precision: 5, scale: 2, nullable: true })
  fraxScore10yrMajor: number | null;

  @Column({ name: 'frax_score_10yr_hip', type: 'decimal', precision: 5, scale: 2, nullable: true })
  fraxScore10yrHip: number | null;

  // ── Risco cardiovascular ──
  @Column({ name: 'framingham_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  framinghamScore: number | null;

  @Column({
    name: 'cardio_risk_category',
    type: 'enum',
    enum: CardioRisk,
    nullable: true,
  })
  cardioRiskCategory: CardioRisk | null;

  // ── Labs ──
  @Column({ type: 'jsonb', nullable: true })
  labs: Record<string, unknown> | null;

  // ── THM ──
  @Column({ name: 'hrt_indicated', type: 'boolean', default: false })
  hrtIndicated: boolean;

  @Column({ name: 'hrt_contraindicated', type: 'boolean', default: false })
  hrtContraindicated: boolean;

  @Column({
    name: 'hrt_contraindication_reasons',
    type: 'text',
    array: true,
    nullable: true,
  })
  hrtContraindicationReasons: string[] | null;

  @Column({ name: 'hrt_scheme', type: 'enum', enum: HRTScheme, nullable: true })
  hrtScheme: HRTScheme | null;

  @Column({
    name: 'estrogen_route',
    type: 'enum',
    enum: EstrogenRoute,
    nullable: true,
  })
  estrogenRoute: EstrogenRoute | null;

  @Column({ name: 'estrogen_drug', type: 'text', nullable: true })
  estrogenDrug: string | null;

  @Column({ name: 'progestogen_drug', type: 'text', nullable: true })
  progestogenDrug: string | null;

  @Column({ name: 'hrt_start_date', type: 'date', nullable: true })
  hrtStartDate: string | null;

  @Column({ name: 'hrt_review_date', type: 'date', nullable: true })
  hrtReviewDate: string | null;

  @Column({ name: 'hrt_side_effects', type: 'text', nullable: true })
  hrtSideEffects: string | null;

  // ── Terapias não-hormonais ──
  @Column({
    name: 'non_hormonal_therapy',
    type: 'text',
    array: true,
    nullable: true,
  })
  nonHormonalTherapy: string[] | null;

  // ── Osteoporose: tratamento ──
  @Column({ name: 'osteoporosis_treatment', type: 'text', nullable: true })
  osteoporosisTreatment: string | null;

  @Column({
    name: 'calcium_supplementation',
    type: 'decimal',
    precision: 7,
    scale: 1,
    nullable: true,
  })
  calciumSupplementation: number | null;

  @Column({
    name: 'vitamin_d_supplementation',
    type: 'decimal',
    precision: 7,
    scale: 1,
    nullable: true,
  })
  vitaminDSupplementation: number | null;

  @Column({
    name: 'vitamin_d_level',
    type: 'decimal',
    precision: 5,
    scale: 1,
    nullable: true,
  })
  vitaminDLevel: number | null;

  // ── Saúde cognitiva ──
  @Column({ name: 'mms_score', type: 'int', nullable: true })
  mmsScore: number | null;

  @Column({ name: 'moca_score', type: 'int', nullable: true })
  mocaScore: number | null;

  @Column({ name: 'cognitive_complaint', type: 'boolean', default: false })
  cognitiveComplaint: boolean;

  @Column({ name: 'cognitive_referral', type: 'boolean', nullable: true })
  cognitiveReferral: boolean | null;

  // ── Saúde sexual ──
  @Column({ name: 'fsfi_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  fsfiScore: number | null;

  @Column({ name: 'sexual_dysfunction', type: 'boolean', nullable: true })
  sexualDysfunction: boolean | null;

  @Column({ name: 'sexual_dysfunction_type', type: 'text', nullable: true })
  sexualDysfunctionType: string | null;

  // ── Conduta ──
  @Column({ type: 'text', nullable: true })
  diagnosis: string | null;

  @Column({ name: 'icd10_codes', type: 'text', array: true, nullable: true })
  icd10Codes: string[] | null;

  @Column({ name: 'treatment_plan', type: 'text', nullable: true })
  treatmentPlan: string | null;

  @Column({ name: 'next_dexa_date', type: 'date', nullable: true })
  nextDexaDate: string | null;

  @Column({ name: 'next_mammography_date', type: 'date', nullable: true })
  nextMammographyDate: string | null;

  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes: string | null;

  // ── Copiloto ──
  @Column({ type: 'jsonb', nullable: true })
  alerts: MenopauseAlert[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
