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
import { GaMethod, Chorionicity, PregnancyStatus } from './pregnancy.enums.js';

@Entity('pregnancies')
export class Pregnancy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'lmp_date', type: 'date' })
  lmpDate: string;

  @Column({ name: 'us_dating_date', type: 'date', nullable: true })
  usDatingDate: string | null;

  @Column({ name: 'us_dating_ga_days', type: 'int', nullable: true })
  usDatingGaDays: number | null;

  @Column({ type: 'date' })
  edd: string;

  @Column({ name: 'ga_method', type: 'enum', enum: GaMethod })
  gaMethod: GaMethod;

  @Column({ type: 'int' })
  gravida: number;

  @Column({ type: 'int' })
  para: number;

  @Column({ type: 'int' })
  abortus: number;

  @Column({ type: 'int', default: 1 })
  plurality: number;

  @Column({ type: 'enum', enum: Chorionicity, nullable: true })
  chorionicity: Chorionicity | null;

  @Column({ type: 'enum', enum: PregnancyStatus, default: PregnancyStatus.ACTIVE })
  status: PregnancyStatus;

  @Column({ name: 'high_risk_flags', type: 'jsonb', default: [] })
  highRiskFlags: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
