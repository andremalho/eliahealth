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

// ──────────────────────────────────────────────────────────
// INTEGRATION NOTES — Glucometer connectivity
// ──────────────────────────────────────────────────────────
// BLUETOOTH:
//   Use Web Bluetooth API in the frontend to connect BLE glucometers.
//   Compatible devices: Accu-Chek Guide, OneTouch Verio Reflect, Contour Next One.
//   Protocol: GATT Blood Glucose Profile (org.bluetooth.service.glucose)
//   Service UUID: 0x1808, Characteristic: 0x2A18 (Glucose Measurement)
//   Set source = ReadingSource.DEVICE_BLUETOOTH on synced readings.
//
// API:
//   Dexcom API: https://developer.dexcom.com (CGM continuous)
//   LibreView API: https://www.libreweb.com (Abbott FreeStyle)
//   Set source = ReadingSource.DEVICE_API on synced readings.
//
// USB:
//   Accu-Chek Smart Pix: USB HID protocol
//   OneTouch Verio: USB serial protocol
//   Set source = ReadingSource.DEVICE_USB on synced readings.
//
// WEBHOOK (future):
//   POST /glucose/webhook/:deviceSerialNumber — receives data from cloud APIs
//   Validate HMAC signature, map to GlucoseReading, deduplicate via deviceReadingId
// ──────────────────────────────────────────────────────────

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

  @Column({ name: 'reading_date_time', type: 'timestamptz', nullable: true })
  readingDateTime: Date | null;

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

  @Column({ name: 'device_reading_id', type: 'varchar', nullable: true, unique: true })
  deviceReadingId: string | null;

  @Column({ name: 'raw_device_data', type: 'jsonb', nullable: true })
  rawDeviceData: Record<string, unknown> | null;

  @Column({ name: 'extra_fields', type: 'jsonb', nullable: true })
  extraFields: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
