import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { User } from '../auth/user.entity.js';

export enum NoteType { POSTIT = 'postit', ANNOTATION = 'annotation', REMINDER = 'reminder' }

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' })
  pregnancyId: string;

  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'enum', enum: NoteType, default: NoteType.POSTIT })
  type: NoteType;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'formatted_content', type: 'text', nullable: true })
  formattedContent: string | null;

  @Column({ type: 'varchar', default: '#FFF4B8' })
  color: string;

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ name: 'is_private', type: 'boolean', default: true })
  isPrivate: boolean;

  @Column({ name: 'is_shared_with_patient', type: 'boolean', default: false })
  isSharedWithPatient: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
