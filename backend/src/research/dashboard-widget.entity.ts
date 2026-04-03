import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ResearchDashboard } from './research-dashboard.entity.js';
import { WidgetType, DashboardMetric, WidgetWidth } from './dashboard.enums.js';

@Entity('dashboard_widgets')
export class DashboardWidget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dashboard_id', type: 'uuid' })
  dashboardId: string;

  @ManyToOne(() => ResearchDashboard, (d) => d.widgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dashboard_id' })
  dashboard: ResearchDashboard;

  @Column({ name: 'widget_type', type: 'enum', enum: WidgetType })
  widgetType: WidgetType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'enum', enum: DashboardMetric })
  metric: DashboardMetric;

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, unknown> | null;

  @Column({ name: 'chart_config', type: 'jsonb', nullable: true })
  chartConfig: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'enum', enum: WidgetWidth, default: WidgetWidth.HALF })
  width: WidgetWidth;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
