import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

@Entity('public_shares')
export class PublicShare {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' }) pregnancyId: string;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'patient_id', type: 'uuid' }) patientId: string;

  @Column({ name: 'share_token', type: 'uuid', unique: true }) shareToken: string;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt: Date;
  @Column({ name: 'access_count', type: 'int', default: 0 }) accessCount: number;
  @Column({ name: 'revoked', type: 'boolean', default: false }) revoked: boolean;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
