import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CopilotCheck } from './copilot-check.entity.js';
import { CheckSeverity } from '../enums/check-severity.enum.js';
import { CheckCategory } from '../enums/check-category.enum.js';
import { CheckResolution } from '../enums/check-resolution.enum.js';

@Entity('copilot_check_items')
export class CopilotCheckItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'copilot_check_id', type: 'uuid' })
  copilotCheckId: string;

  @ManyToOne(() => CopilotCheck, (check) => check.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'copilot_check_id' })
  copilotCheck: CopilotCheck;

  @Column({
    type: 'enum',
    enum: CheckSeverity,
    enumName: 'copilot_check_severity_enum',
  })
  severity: CheckSeverity;

  @Column({
    type: 'enum',
    enum: CheckCategory,
    enumName: 'copilot_check_category_enum',
  })
  category: CheckCategory;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'suggested_action', type: 'text', nullable: true })
  suggestedAction: string | null;

  @Column({ name: 'guideline_reference', type: 'varchar', length: 200, nullable: true })
  guidelineReference: string | null;

  @Column({
    type: 'enum',
    enum: CheckResolution,
    enumName: 'copilot_check_resolution_enum',
    nullable: true,
  })
  resolution: CheckResolution | null;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
