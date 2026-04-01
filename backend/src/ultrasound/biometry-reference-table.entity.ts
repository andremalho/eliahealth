import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BiometryParameter } from './biometry-parameter.enum.js';

@Entity('biometry_reference_tables')
export class BiometryReferenceTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_name', type: 'varchar' })
  tableName: string;

  @Column({ type: 'enum', enum: BiometryParameter })
  parameter: BiometryParameter;

  @Column({ name: 'gestational_age_weeks', type: 'int' })
  gestationalAgeWeeks: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  p5: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  p10: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  p25: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  p50: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  p75: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  p90: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  p95: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  mean: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  sd: number | null;

  @Column({ type: 'varchar' })
  unit: string;

  @Column({ type: 'varchar' })
  source: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
