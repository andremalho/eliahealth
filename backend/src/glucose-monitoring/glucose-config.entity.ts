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
import { DiabetesType } from './glucose-monitoring.enums.js';

@Entity('glucose_monitoring_configs')
export class GlucoseMonitoringConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid', unique: true })
  pregnancyId: string;

  @OneToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @Column({ name: 'diabetes_type', type: 'enum', enum: DiabetesType })
  diabetesType: DiabetesType;

  @Column({ name: 'target_fasting', type: 'int', default: 95 })
  targetFasting: number;

  @Column({ name: 'target_1h_post_meal', type: 'int', default: 140 })
  target1hPostMeal: number;

  @Column({ name: 'target_2h_post_meal', type: 'int', default: 120 })
  target2hPostMeal: number;

  @Column({ name: 'critical_threshold', type: 'int', default: 200 })
  criticalThreshold: number;

  @Column({ name: 'insulin_protocol', type: 'text', nullable: true })
  insulinProtocol: string | null;

  // TODO: integração com glicosímetros — usar deviceIntegrationId para vincular via Bluetooth/API
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
