import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Hospitalization } from './hospitalization.entity.js';
import { User } from '../auth/user.entity.js';

export enum EvolutionType {
  MEDICAL = 'medical',
  NURSING = 'nursing',
  POSTPARTUM = 'postpartum',
  SURGICAL = 'surgical',
  DISCHARGE = 'discharge',
}

@Entity('evolutions')
export class Evolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hospitalization_id', type: 'uuid' })
  hospitalizationId: string;

  @ManyToOne(() => Hospitalization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hospitalization_id' })
  hospitalization: Hospitalization;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'enum', enum: EvolutionType, default: EvolutionType.MEDICAL })
  type: EvolutionType;

  @Column({ name: 'evolution_date', type: 'timestamptz' })
  evolutionDate: Date;

  // Sinais vitais
  @Column({ name: 'bp_systolic', type: 'int', nullable: true }) bpSystolic: number | null;
  @Column({ name: 'bp_diastolic', type: 'int', nullable: true }) bpDiastolic: number | null;
  @Column({ name: 'heart_rate', type: 'int', nullable: true }) heartRate: number | null;
  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true }) temperature: number | null;
  @Column({ name: 'respiratory_rate', type: 'int', nullable: true }) respiratoryRate: number | null;
  @Column({ name: 'spo2', type: 'int', nullable: true }) spo2: number | null;
  @Column({ name: 'diuresis_ml', type: 'int', nullable: true }) diuresisMl: number | null;

  // SOAP
  @Column({ type: 'text', nullable: true }) subjective: string | null;
  @Column({ type: 'text', nullable: true }) objective: string | null;
  @Column({ type: 'text', nullable: true }) assessment: string | null;
  @Column({ type: 'text', nullable: true }) plan: string | null;

  // Puerpério hospitalar (se aplicável)
  @Column({ name: 'uterine_involution', type: 'varchar', nullable: true }) uterineInvolution: string | null;
  @Column({ name: 'lochia_type', type: 'varchar', nullable: true }) lochiaType: string | null;
  @Column({ name: 'wound_status', type: 'varchar', nullable: true }) woundStatus: string | null;
  @Column({ name: 'breastfeeding', type: 'varchar', nullable: true }) breastfeeding: string | null;

  // Medicações e prescrições
  @Column({ type: 'jsonb', nullable: true }) medications: Record<string, unknown>[] | null;
  @Column({ name: 'iv_fluids', type: 'text', nullable: true }) ivFluids: string | null;

  @Column({ type: 'jsonb', nullable: true }) alerts: { level: string; message: string }[] | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
