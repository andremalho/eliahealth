import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { GlucoseReading } from './glucose-reading.entity.js';
import { AdministrationTimeLabel, AdministeredBy } from './glucose-monitoring.enums.js';

@Entity('insulin_doses')
export class InsulinDose {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' })
  pregnancyId: string;

  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ name: 'glucose_reading_id', type: 'uuid', nullable: true })
  glucoseReadingId: string | null;

  @ManyToOne(() => GlucoseReading, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'glucose_reading_id' })
  glucoseReading: GlucoseReading | null;

  @Column({ name: 'administration_date', type: 'date' })
  administrationDate: string;

  @Column({ name: 'administration_time', type: 'time' })
  administrationTime: string;

  @Column({ name: 'administration_time_label', type: 'enum', enum: AdministrationTimeLabel })
  administrationTimeLabel: AdministrationTimeLabel;

  @Column({ name: 'insulin_type', type: 'varchar' })
  insulinType: string;

  @Column({ name: 'dose_units', type: 'decimal', precision: 5, scale: 1 })
  doseUnits: number;

  @Column({ name: 'prescribed_dose', type: 'decimal', precision: 5, scale: 1, nullable: true })
  prescribedDose: number | null;

  @Column({ name: 'administered_by', type: 'enum', enum: AdministeredBy })
  administeredBy: AdministeredBy;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @Column({ name: 'extra_fields', type: 'jsonb', nullable: true })
  extraFields: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
