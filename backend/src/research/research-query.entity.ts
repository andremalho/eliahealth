import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity.js';
import { QueryStatus } from './dashboard.enums.js';

@Entity('research_queries')
export class ResearchQuery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  question: string;

  @Column({ name: 'sql_generated', type: 'text', nullable: true })
  sqlGenerated: string | null;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, unknown> | null;

  @Column({ name: 'chart_type', type: 'varchar', nullable: true })
  chartType: string | null;

  @Column({ type: 'enum', enum: QueryStatus, default: QueryStatus.PENDING })
  status: QueryStatus;

  @Column({ name: 'execution_time_ms', type: 'int', nullable: true })
  executionTimeMs: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
