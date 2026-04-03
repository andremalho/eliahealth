import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

export enum VaccineType { INFLUENZA = 'influenza', TDAP = 'tdap', HEPATITIS_B = 'hepatitis_b', COVID19 = 'covid19', VSR = 'vsr', OTHER = 'other' }
export enum VaccineStatus { SCHEDULED = 'scheduled', ADMINISTERED = 'administered', OVERDUE = 'overdue', REFUSED = 'refused' }

@Entity('vaccines')
export class Vaccine {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' }) pregnancyId: string;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'vaccine_name', type: 'varchar' }) vaccineName: string;
  @Column({ name: 'vaccine_type', type: 'enum', enum: VaccineType }) vaccineType: VaccineType;
  @Column({ name: 'dose_number', type: 'int', default: 1 }) doseNumber: number;
  @Column({ name: 'scheduled_date', type: 'date', nullable: true }) scheduledDate: string | null;
  @Column({ name: 'administered_date', type: 'date', nullable: true }) administeredDate: string | null;
  @Column({ type: 'enum', enum: VaccineStatus, default: VaccineStatus.SCHEDULED }) status: VaccineStatus;
  @Column({ name: 'batch_number', type: 'varchar', nullable: true }) batchNumber: string | null;
  @Column({ name: 'administered_by', type: 'varchar', nullable: true }) administeredBy: string | null;
  @Column({ type: 'varchar', nullable: true }) location: string | null;
  @Column({ name: 'next_dose_date', type: 'date', nullable: true }) nextDoseDate: string | null;
  @Column({ type: 'varchar', nullable: true }) notes: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
