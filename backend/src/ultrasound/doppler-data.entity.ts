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
import { EndDiastolicFlow, DuctusVenosusAwave } from './ultrasound.enums.js';

@Entity('doppler_data')
export class DopplerData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ultrasound_id', type: 'uuid' })
  ultrasoundId: string;

  @ManyToOne(() => Ultrasound, (u) => u.dopplers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ultrasound_id' })
  ultrasound: Ultrasound;

  @Column({ name: 'fetus_number', type: 'int', default: 1 })
  fetusNumber: number;

  @Column({ name: 'umbilical_artery_pi', type: 'decimal', precision: 5, scale: 3, nullable: true })
  umbilicalArteryPI: number | null;

  @Column({ name: 'umbilical_artery_ri', type: 'decimal', precision: 5, scale: 3, nullable: true })
  umbilicalArteryRI: number | null;

  @Column({ name: 'umbilical_artery_sd', type: 'decimal', precision: 5, scale: 2, nullable: true })
  umbilicalArterySD: number | null;

  @Column({ name: 'umbilical_artery_edf', type: 'enum', enum: EndDiastolicFlow, nullable: true })
  umbilicalArteryEDF: EndDiastolicFlow | null;

  @Column({ name: 'mca_psv', type: 'decimal', precision: 6, scale: 2, nullable: true })
  mcaPSV: number | null;

  @Column({ name: 'mca_pi', type: 'decimal', precision: 5, scale: 3, nullable: true })
  mcaPI: number | null;

  @Column({ name: 'uterine_artery_pi', type: 'decimal', precision: 5, scale: 3, nullable: true })
  uterineArteryPI: number | null;

  @Column({ name: 'uterine_artery_notch', type: 'boolean', nullable: true })
  uterineArteryNotch: boolean | null;

  @Column({ name: 'ductus_venosus_pi', type: 'decimal', precision: 5, scale: 3, nullable: true })
  ductusVenosusPI: number | null;

  @Column({ name: 'ductus_venosus_awave', type: 'enum', enum: DuctusVenosusAwave, nullable: true })
  ductusVenosusAwave: DuctusVenosusAwave | null;

  @Column({ name: 'extra_fields', type: 'jsonb', nullable: true })
  extraFields: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
