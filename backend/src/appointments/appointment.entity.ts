import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity.js';
import { User } from '../auth/user.entity.js';
import { AppointmentStatus, AppointmentType, AppointmentCategory } from './appointment.enums.js';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ type: 'enum', enum: AppointmentType, default: AppointmentType.CONSULTATION })
  type: AppointmentType;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @Column({ type: 'enum', enum: AppointmentCategory, nullable: true })
  category: AppointmentCategory | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'pregnancy_id', type: 'uuid', nullable: true })
  pregnancyId: string | null;

  @Column({ name: 'booked_by_patient', type: 'boolean', default: false })
  bookedByPatient: boolean;

  @Column({ name: 'auto_scheduled', type: 'boolean', default: false })
  autoScheduled: boolean;

  @Column({ name: 'reminder_48h_sent', type: 'boolean', default: false })
  reminder48hSent: boolean;

  @Column({ name: 'reminder_24h_sent', type: 'boolean', default: false })
  reminder24hSent: boolean;

  @Column({ name: 'insurance_type', type: 'varchar', nullable: true })
  insuranceType: string | null;

  @Column({ name: 'insurance_provider', type: 'varchar', nullable: true })
  insuranceProvider: string | null;

  @Column({ name: 'insurance_member_id', type: 'varchar', nullable: true })
  insuranceMemberId: string | null;

  @Column({ name: 'insurance_plan', type: 'varchar', nullable: true })
  insurancePlan: string | null;

  @Column({ name: 'insurance_card_url', type: 'varchar', nullable: true })
  insuranceCardUrl: string | null;

  @Column({ name: 'exam_request_url', type: 'varchar', nullable: true })
  examRequestUrl: string | null;

  @Column({ name: 'patient_cpf', type: 'varchar', nullable: true })
  patientCpf: string | null;

  @Column({ name: 'patient_cep', type: 'varchar', nullable: true })
  patientCep: string | null;

  @Column({ name: 'is_checked_in', type: 'boolean', default: false })
  isCheckedIn: boolean;

  @Column({ name: 'checked_in_at', type: 'timestamptz', nullable: true })
  checkedInAt: Date | null;

  @Column({ name: 'checkin_token', type: 'varchar', nullable: true, unique: true })
  checkinToken: string | null;

  @Column({ name: 'documents_confirmed', type: 'boolean', default: false })
  documentsConfirmed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
