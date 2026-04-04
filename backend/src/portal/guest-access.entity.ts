import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

export enum InviteMethod { EMAIL = 'email', PHONE = 'phone' }
export enum GuestAccessType { READONLY = 'readonly', NOTE_WRITER = 'note_writer' }

@Entity('guest_access')
export class GuestAccess {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' }) pregnancyId: string;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'granted_by', type: 'uuid' }) grantedBy: string;
  @Column({ name: 'invite_method', type: 'enum', enum: InviteMethod }) inviteMethod: InviteMethod;
  @Column({ name: 'invite_contact', type: 'varchar' }) inviteContact: string;
  @Column({ name: 'access_type', type: 'enum', enum: GuestAccessType, default: GuestAccessType.READONLY }) accessType: GuestAccessType;
  @Column({ name: 'show_weight_chart', type: 'boolean', default: false }) showWeightChart: boolean;
  @Column({ name: 'access_token', type: 'uuid', unique: true }) accessToken: string;
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true }) expiresAt: Date | null;
  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true }) acceptedAt: Date | null;
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true }) revokedAt: Date | null;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
