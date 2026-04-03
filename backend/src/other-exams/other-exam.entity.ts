import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

@Entity('other_exams')
export class OtherExam {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' }) pregnancyId: string;
  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' }) pregnancy: Pregnancy;

  @Column({ name: 'exam_name', type: 'varchar' }) examName: string;
  @Column({ name: 'exam_date', type: 'date' }) examDate: string;
  @Column({ type: 'text', nullable: true }) result: string | null;
  @Column({ name: 'is_altered', type: 'boolean', default: false }) isAltered: boolean;
  @Column({ name: 'attachment_url', type: 'varchar', nullable: true }) attachmentUrl: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
