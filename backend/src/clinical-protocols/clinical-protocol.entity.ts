import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProtocolCategory, ProtocolPriority } from './clinical-protocol.enums.js';

@Entity('clinical_protocols')
export class ClinicalProtocol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'enum', enum: ProtocolCategory })
  category: ProtocolCategory;

  @Column({ type: 'varchar' })
  source: string;

  @Column({ name: 'ga_weeks_min', type: 'int', nullable: true })
  gaWeeksMin: number | null;

  @Column({ name: 'ga_weeks_max', type: 'int', nullable: true })
  gaWeeksMax: number | null;

  @Column({ name: 'trigger_condition', type: 'varchar', nullable: true })
  triggerCondition: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'action_items', type: 'jsonb', default: [] })
  actionItems: string[];

  @Column({ type: 'enum', enum: ProtocolPriority })
  priority: ProtocolPriority;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
