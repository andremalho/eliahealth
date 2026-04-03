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
import {
  BpArm, BpPosition, BpStatus, BpReadingSource,
  BpMeasurementLocation, BpMeasurementMethod,
} from './bp-monitoring.enums.js';

// ──────────────────────────────────────────────────────────
// INTEGRATION NOTES — Device connectivity
// ──────────────────────────────────────────────────────────
// Bluetooth integration with sphygmomanometers (e.g. Omron, Withings):
//   - Use deviceId to identify the paired device
//   - Source should be set to BpReadingSource.DEVICE_SYNC
//   - POST /bp/device-sync endpoint (TODO) should accept readings
//     with deviceId and auto-match to pregnancy
//
// Webhook for connected devices:
//   - POST /bp/webhook/:deviceId — receives data from cloud APIs
//     (Omron Connect, Withings Health Mate, etc.)
//   - Validate HMAC signature from metadata.webhookSecret
//   - Map external reading format to CreateBpReadingDto
// ──────────────────────────────────────────────────────────

@Entity('bp_readings')
export class BpReading {
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

  @Column({ name: 'reading_date_time', type: 'timestamptz', nullable: true })
  readingDateTime: Date | null;

  @Column({ type: 'int' })
  systolic: number;

  @Column({ type: 'int' })
  diastolic: number;

  @Column({ name: 'heart_rate', type: 'int', nullable: true })
  heartRate: number | null;

  @Column({ type: 'enum', enum: BpArm, default: BpArm.LEFT })
  arm: BpArm;

  @Column({ type: 'enum', enum: BpPosition, default: BpPosition.SITTING })
  position: BpPosition;

  @Column({ type: 'enum', enum: BpStatus, default: BpStatus.NORMAL })
  status: BpStatus;

  @Column({ name: 'alert_triggered', type: 'boolean', default: false })
  alertTriggered: boolean;

  @Column({ name: 'alert_message', type: 'varchar', nullable: true })
  alertMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  symptoms: string[] | null;

  @Column({ name: 'symptoms_notes', type: 'varchar', nullable: true })
  symptomsNotes: string | null;

  @Column({ type: 'enum', enum: BpReadingSource, default: BpReadingSource.MANUAL })
  source: BpReadingSource;

  @Column({ name: 'measurement_location', type: 'enum', enum: BpMeasurementLocation, default: BpMeasurementLocation.HOME })
  measurementLocation: BpMeasurementLocation;

  @Column({ name: 'measurement_method', type: 'enum', enum: BpMeasurementMethod, default: BpMeasurementMethod.MANUAL })
  measurementMethod: BpMeasurementMethod;

  @Column({ name: 'device_id', type: 'varchar', nullable: true })
  deviceId: string | null;

  @Column({ name: 'gestational_age_days', type: 'int', nullable: true })
  gestationalAgeDays: number | null;

  @Column({ name: 'extra_fields', type: 'jsonb', nullable: true })
  extraFields: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
