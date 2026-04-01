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
import { NasalBone, PlacentaGrade } from './ultrasound.enums.js';

@Entity('fetal_biometries')
export class FetalBiometry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ultrasound_id', type: 'uuid' })
  ultrasoundId: string;

  @ManyToOne(() => Ultrasound, (u) => u.biometries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ultrasound_id' })
  ultrasound: Ultrasound;

  @Column({ name: 'fetus_number', type: 'int', default: 1 })
  fetusNumber: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  bpd: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  hc: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  ac: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  fl: number | null;

  @Column({ type: 'decimal', precision: 7, scale: 1, nullable: true })
  efw: number | null;

  @Column({ name: 'efw_percentile', type: 'decimal', precision: 5, scale: 2, nullable: true })
  efwPercentile: number | null;

  @Column({ name: 'crown_rump_length', type: 'decimal', precision: 6, scale: 2, nullable: true })
  crownRumpLength: number | null;

  @Column({ name: 'nuchal_translucency', type: 'decimal', precision: 4, scale: 2, nullable: true })
  nuchalTranslucency: number | null;

  @Column({ name: 'nasal_bone', type: 'enum', enum: NasalBone, default: NasalBone.NOT_EVALUATED })
  nasalBone: NasalBone;

  @Column({ name: 'amniotic_fluid_index', type: 'decimal', precision: 5, scale: 2, nullable: true })
  amnioticFluidIndex: number | null;

  @Column({ name: 'placenta_location', type: 'varchar', nullable: true })
  placentaLocation: string | null;

  @Column({ name: 'placenta_grade', type: 'enum', enum: PlacentaGrade, nullable: true })
  placentaGrade: PlacentaGrade | null;

  @Column({ name: 'cervical_length', type: 'decimal', precision: 5, scale: 2, nullable: true })
  cervicalLength: number | null;

  @Column({ name: 'extra_fields', type: 'jsonb', nullable: true })
  extraFields: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
