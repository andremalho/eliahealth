import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { User } from '../auth/user.entity.js';

@Entity('annotations')
export class Annotation {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' }) pregnancyId: string;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'author_id', type: 'uuid' }) authorId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' }) author: User;

  @Column({ type: 'text' }) content: string;

  @Column({ name: 'is_visible_to_patient', type: 'boolean', default: true })
  isVisibleToPatient: boolean;

  @Column({ name: 'is_visible_to_team', type: 'boolean', default: true })
  isVisibleToTeam: boolean;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
