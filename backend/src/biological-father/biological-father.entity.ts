import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

export enum RhFactor { POSITIVE = 'positive', NEGATIVE = 'negative' }

@Entity('biological_fathers')
export class BiologicalFather {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid', unique: true }) pregnancyId: string;
  @OneToOne(() => Pregnancy, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ type: 'varchar', nullable: true }) name: string | null;
  @Column({ type: 'int', nullable: true }) age: number | null;
  @Column({ name: 'blood_type', type: 'varchar', nullable: true }) bloodType: string | null;
  @Column({ type: 'enum', enum: RhFactor, nullable: true }) rh: RhFactor | null;
  @Column({ name: 'genetic_conditions', type: 'text', nullable: true }) geneticConditions: string | null;
  @Column({ name: 'infectious_diseases', type: 'text', nullable: true }) infectiousDiseases: string | null;
  @Column({ name: 'family_history', type: 'text', nullable: true }) familyHistory: string | null;
  @Column({ type: 'text', nullable: true }) observations: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
