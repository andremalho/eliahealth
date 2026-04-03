import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum TenantPlan {
  ELIAHEALTH = 'eliahealth',
  WHITE_LABEL_BASIC = 'white_label_basic',
  WHITE_LABEL_PRO = 'white_label_pro',
  ENTERPRISE = 'enterprise',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) name: string;
  @Column({ type: 'varchar', unique: true }) slug: string;
  @Column({ name: 'logo_url', type: 'varchar', nullable: true }) logoUrl: string | null;
  @Column({ name: 'primary_color', type: 'varchar', nullable: true }) primaryColor: string | null;
  @Column({ name: 'secondary_color', type: 'varchar', nullable: true }) secondaryColor: string | null;
  @Column({ name: 'custom_domain', type: 'varchar', nullable: true }) customDomain: string | null;
  @Column({ name: 'powered_by_visible', type: 'boolean', default: true }) poweredByVisible: boolean;
  @Column({ name: 'powered_by_text', type: 'varchar', default: 'Powered by EliaHealth' }) poweredByText: string;
  @Column({ type: 'enum', enum: TenantPlan, default: TenantPlan.ELIAHEALTH }) plan: TenantPlan;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean;
  @Column({ name: 'max_users', type: 'int', default: 5 }) maxUsers: number;
  @Column({ name: 'max_patients', type: 'int', default: 100 }) maxPatients: number;
  @Column({ type: 'jsonb', default: [] }) features: string[];
  @Column({ name: 'contact_email', type: 'varchar' }) contactEmail: string;
  @Column({ name: 'contact_phone', type: 'varchar', nullable: true }) contactPhone: string | null;
  @Column({ type: 'varchar', nullable: true }) address: string | null;
  @Column({ type: 'varchar', nullable: true }) cnpj: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
