import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity.js';

@Entity('password_history')
export class PasswordHistory {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'user_id', type: 'uuid' }) userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) user: User;

  @Column({ name: 'password_hash', type: 'varchar' }) passwordHash: string;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
