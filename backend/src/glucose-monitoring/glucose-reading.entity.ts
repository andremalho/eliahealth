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
import { MeasurementType, GlucoseStatus, ReadingSource } from './glucose-monitoring.enums.js';

@Entity('glucose_readings')
export class GlucoseReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' })
  pregnancyId: string;

  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ name: 'reading_date', type: 'date' })
  readingDate: string;

  @Column({ name: 'reading_time', type: 'time' })
  readingTime: string;

  @Column({ name: 'measurement_type', type: 'enum', enum: MeasurementType })
  measurementType: MeasurementType;

  @Column({ name: 'glucose_value', type: 'int' })
  glucoseValue: number;

  @Column({ type: 'enum', enum: GlucoseStatus, default: GlucoseStatus.NORMAL })
  status: GlucoseStatus;

  @Column({ name: 'alert_triggered', type: 'boolean', default: false })
  alertTriggered: boolean;

  @Column({ name: 'alert_message', type: 'varchar', nullable: true })
  alertMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  symptoms: string[] | null;

  @Column({ name: 'symptoms_notes', type: 'varchar', nullable: true })
  symptomsNotes: string | null;

  @Column({ type: 'enum', enum: ReadingSource, default: ReadingSource.MANUAL })
  source: ReadingSource;

  @Column({ name: 'extra_fields', type: 'jsonb', nullable: true })
  extraFields: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
