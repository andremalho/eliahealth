import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ultrasound } from './ultrasound.entity.js';
import { PresentAbsent, AmnioticFluidStatus, NstResult } from './ultrasound.enums.js';

@Entity('biophysical_profiles')
export class BiophysicalProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ultrasound_id', type: 'uuid' })
  ultrasoundId: string;

  @ManyToOne(() => Ultrasound, (u) => u.biophysicalProfiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ultrasound_id' })
  ultrasound: Ultrasound;

  @Column({ name: 'fetus_number', type: 'int', default: 1 })
  fetusNumber: number;

  @Column({ name: 'fetal_breathing', type: 'enum', enum: PresentAbsent })
  fetalBreathing: PresentAbsent;

  @Column({ name: 'fetal_movement', type: 'enum', enum: PresentAbsent })
  fetalMovement: PresentAbsent;

  @Column({ name: 'fetal_tone', type: 'enum', enum: PresentAbsent })
  fetalTone: PresentAbsent;

  @Column({ name: 'amniotic_fluid', type: 'enum', enum: AmnioticFluidStatus })
  amnioticFluid: AmnioticFluidStatus;

  @Column({ name: 'nst_result', type: 'enum', enum: NstResult, default: NstResult.NOT_PERFORMED })
  nstResult: NstResult;

  @Column({ name: 'total_score', type: 'int' })
  totalScore: number;

  @Column({ type: 'varchar', nullable: true })
  interpretation: string | null;

  @Column({ name: 'extra_fields', type: 'jsonb', nullable: true })
  extraFields: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
