import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

export enum LochiaType {
  RUBRA = 'rubra',
  SEROSA = 'serosa',
  ALBA = 'alba',
  ABSENT = 'absent',
}

export enum LochiaAmount {
  SCANT = 'scant',
  MODERATE = 'moderate',
  HEAVY = 'heavy',
}

export enum WoundStatus {
  GOOD = 'good',
  DEHISCENCE = 'dehiscence',
  INFECTION = 'infection',
  HEMATOMA = 'hematoma',
  NOT_APPLICABLE = 'not_applicable',
}

export enum UterineInvolution {
  NORMAL = 'normal',
  SUBINVOLUTION = 'subinvolution',
  NOT_PALPABLE = 'not_palpable',
}

export enum BreastfeedingStatus {
  EXCLUSIVE = 'exclusive',
  PREDOMINANT = 'predominant',
  COMPLEMENTED = 'complemented',
  NOT_BREASTFEEDING = 'not_breastfeeding',
}

export enum BreastCondition {
  NORMAL = 'normal',
  ENGORGEMENT = 'engorgement',
  FISSURE = 'fissure',
  MASTITIS = 'mastitis',
  ABSCESS = 'abscess',
}

export enum MoodScreening {
  NORMAL = 'normal',
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

@Entity('postpartum_consultations')
export class PostpartumConsultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'pregnancy_id', type: 'uuid' })
  pregnancyId: string;

  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'days_postpartum', type: 'int' })
  daysPostpartum: number;

  // ── Sinais Vitais ──
  @Column({ name: 'weight_kg', type: 'decimal', precision: 5, scale: 2, nullable: true })
  weightKg: number | null;

  @Column({ name: 'bp_systolic', type: 'int', nullable: true })
  bpSystolic: number | null;

  @Column({ name: 'bp_diastolic', type: 'int', nullable: true })
  bpDiastolic: number | null;

  @Column({ name: 'temperature', type: 'decimal', precision: 3, scale: 1, nullable: true })
  temperature: number | null;

  @Column({ name: 'heart_rate', type: 'int', nullable: true })
  heartRate: number | null;

  // ── Útero e Lóquios ──
  @Column({ name: 'uterine_involution', type: 'enum', enum: UterineInvolution, nullable: true })
  uterineInvolution: UterineInvolution | null;

  @Column({ name: 'fundal_height_cm', type: 'decimal', precision: 4, scale: 1, nullable: true })
  fundalHeightCm: number | null;

  @Column({ name: 'lochia_type', type: 'enum', enum: LochiaType, nullable: true })
  lochiaType: LochiaType | null;

  @Column({ name: 'lochia_amount', type: 'enum', enum: LochiaAmount, nullable: true })
  lochiaAmount: LochiaAmount | null;

  @Column({ name: 'lochia_odor', type: 'boolean', nullable: true })
  lochiaOdor: boolean | null;

  // ── Ferida Operatória ──
  @Column({ name: 'wound_status', type: 'enum', enum: WoundStatus, nullable: true })
  woundStatus: WoundStatus | null;

  @Column({ name: 'wound_notes', type: 'text', nullable: true })
  woundNotes: string | null;

  // ── Mamas e Amamentação ──
  @Column({ name: 'breastfeeding_status', type: 'enum', enum: BreastfeedingStatus, nullable: true })
  breastfeedingStatus: BreastfeedingStatus | null;

  @Column({ name: 'breast_condition', type: 'enum', enum: BreastCondition, nullable: true })
  breastCondition: BreastCondition | null;

  @Column({ name: 'breastfeeding_notes', type: 'text', nullable: true })
  breastfeedingNotes: string | null;

  // ── Saúde Mental ──
  @Column({ name: 'mood_screening', type: 'enum', enum: MoodScreening, nullable: true })
  moodScreening: MoodScreening | null;

  @Column({ name: 'epds_score', type: 'int', nullable: true })
  epdsScore: number | null;

  @Column({ name: 'mood_notes', type: 'text', nullable: true })
  moodNotes: string | null;

  // ── Contracepção ──
  @Column({ name: 'contraception_discussed', type: 'boolean', nullable: true })
  contraceptionDiscussed: boolean | null;

  @Column({ name: 'contraception_method', type: 'varchar', nullable: true })
  contraceptionMethod: string | null;

  // ── Dados do RN (apenas na 1ª consulta) ──
  @Column({ name: 'newborn_data', type: 'jsonb', nullable: true })
  newbornData: {
    currentWeight?: number;
    feedingWell?: boolean;
    jaundice?: boolean;
    umbilicalStump?: string; // 'attached' | 'fallen' | 'infected'
    skinColor?: string;
    vaccinesUpToDate?: boolean;
    heelPrickDone?: boolean;
    hearingScreenDone?: boolean;
    redReflexDone?: boolean;
    notes?: string;
  } | null;

  // ── SOAP ──
  @Column({ type: 'text', nullable: true })
  subjective: string | null;

  @Column({ type: 'text', nullable: true })
  objective: string | null;

  @Column({ type: 'text', nullable: true })
  assessment: string | null;

  @Column({ type: 'text', nullable: true })
  plan: string | null;

  @Column({ name: 'confidential_notes', type: 'text', nullable: true })
  confidentialNotes: string | null;

  @Column({ name: 'next_appointment_date', type: 'date', nullable: true })
  nextAppointmentDate: string | null;

  @Column({ type: 'jsonb', nullable: true })
  alerts: { level: string; message: string }[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
