import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity.js';
import { User } from '../auth/user.entity.js';

export enum AlertStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  EXPIRED = 'expired',
}

@Entity('appointment_alerts')
export class AppointmentAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'pregnancy_id', type: 'uuid', nullable: true })
  pregnancyId: string | null;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by' })
  requester: User;

  @Column({ name: 'appointment_type', type: 'varchar' })
  appointmentType: string;

  @Column({ name: 'ga_window_min', type: 'int', nullable: true })
  gaWindowMin: number | null;

  @Column({ name: 'ga_window_max', type: 'int', nullable: true })
  gaWindowMax: number | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.PENDING })
  status: AlertStatus;

  @Column({ name: 'scheduled_appointment_id', type: 'uuid', nullable: true })
  scheduledAppointmentId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
