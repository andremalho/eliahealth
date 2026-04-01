import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { BpCondition } from './bp-monitoring.enums.js';

@Entity('bp_monitoring_configs')
export class BpMonitoringConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid', unique: true })
  pregnancyId: string;

  @OneToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'enum', enum: BpCondition })
  condition: BpCondition;

  @Column({ name: 'target_systolic_max', type: 'int', default: 140 })
  targetSystolicMax: number;

  @Column({ name: 'target_diastolic_max', type: 'int', default: 90 })
  targetDiastolicMax: number;

  @Column({ name: 'critical_systolic', type: 'int', default: 160 })
  criticalSystolic: number;

  @Column({ name: 'critical_diastolic', type: 'int', default: 110 })
  criticalDiastolic: number;

  @Column({ name: 'measurement_frequency', type: 'varchar', nullable: true })
  measurementFrequency: string | null;

  @Column({ name: 'antihypertensive_protocol', type: 'text', nullable: true })
  antihypertensiveProtocol: string | null;

  // TODO: integração com esfigmomanômetros eletrônicos — vincular via Bluetooth/API
  @Column({ name: 'device_integration_id', type: 'varchar', nullable: true })
  deviceIntegrationId: string | null;

  @Column({ name: 'device_brand', type: 'varchar', nullable: true })
  deviceBrand: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
