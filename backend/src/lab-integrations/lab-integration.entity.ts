import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('lab_integrations')
export class LabIntegration {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'lab_name', type: 'varchar' }) labName: string;
  @Column({ name: 'lab_code', type: 'varchar' }) labCode: string;
  @Column({ name: 'api_key', type: 'varchar' }) apiKey: string;
  @Column({ name: 'webhook_secret', type: 'varchar' }) webhookSecret: string;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean;
  @Column({ name: 'supported_exam_types', type: 'jsonb', default: [] }) supportedExamTypes: string[];

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
