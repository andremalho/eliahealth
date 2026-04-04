import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { User } from '../auth/user.entity.js';

@Entity('guest_shares')
export class GuestShare {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' }) pregnancyId: string;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'shared_by', type: 'uuid' }) sharedBy: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shared_by' }) sharedByUser: User;

  @Column({ name: 'guest_name', type: 'varchar' }) guestName: string;
  @Column({ name: 'guest_email', type: 'varchar' }) guestEmail: string;
  @Column({ name: 'access_token', type: 'varchar', unique: true }) accessToken: string;
  @Column({ type: 'varchar', default: 'view_only' }) permission: string;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
