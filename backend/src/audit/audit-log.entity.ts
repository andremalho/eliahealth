import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  SHARE = 'share',
  LOGIN = 'login',
  LOGOUT = 'logout',
  FAILED_LOGIN = 'failed_login',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true }) userId: string | null;
  @Column({ name: 'patient_id', type: 'uuid', nullable: true }) patientId: string | null;
  @Column({ name: 'pregnancy_id', type: 'uuid', nullable: true }) pregnancyId: string | null;

  @Column({ type: 'enum', enum: AuditAction }) action: AuditAction;
  @Column({ type: 'varchar' }) resource: string;
  @Column({ name: 'resource_id', type: 'uuid', nullable: true }) resourceId: string | null;

  @Column({ name: 'ip_address', type: 'varchar' }) ipAddress: string;
  @Column({ name: 'user_agent', type: 'varchar', nullable: true }) userAgent: string | null;
  @Column({ name: 'request_data', type: 'jsonb', nullable: true }) requestData: Record<string, unknown> | null;
  @Column({ name: 'response_status', type: 'int' }) responseStatus: number;
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true }) tenantId: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
