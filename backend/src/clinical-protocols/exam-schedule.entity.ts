import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trimester } from './clinical-protocol.enums.js';

@Entity('exam_schedules')
export class ExamSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exam_name', type: 'varchar' })
  examName: string;

  @Column({ name: 'exam_category', type: 'varchar' })
  examCategory: string;

  @Column({ name: 'ga_weeks_ideal', type: 'int' })
  gaWeeksIdeal: number;

  @Column({ name: 'ga_weeks_min', type: 'int' })
  gaWeeksMin: number;

  @Column({ name: 'ga_weeks_max', type: 'int' })
  gaWeeksMax: number;

  @Column({ type: 'enum', enum: Trimester })
  trimester: Trimester;

  @Column({ name: 'is_routine', type: 'boolean' })
  isRoutine: boolean;

  @Column({ type: 'varchar', nullable: true })
  indication: string | null;

  @Column({ type: 'varchar' })
  source: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
