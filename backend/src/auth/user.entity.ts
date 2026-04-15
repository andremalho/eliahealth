import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, CertificateProvider } from './auth.enums.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PHYSICIAN })
  role: UserRole;

  @Column({ type: 'varchar', nullable: true })
  crm: string | null;

  @Column({ type: 'varchar', nullable: true })
  coren: string | null;

  @Column({ type: 'varchar', nullable: true })
  specialty: string | null;

  @Column({ name: 'tenant_id', type: 'varchar', nullable: true })
  tenantId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'preferred_language', type: 'varchar', default: 'pt_BR' })
  preferredLanguage: string;

  @Column({ name: 'refresh_token_hash', type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  // ── Certificacao digital ──

  @Column({ name: 'certificate_thumbprint', type: 'varchar', length: 64, nullable: true })
  certificateThumbprint: string | null;

  @Column({ name: 'certificate_subject', type: 'varchar', length: 500, nullable: true })
  certificateSubject: string | null;

  @Column({ name: 'certificate_issuer', type: 'varchar', length: 500, nullable: true })
  certificateIssuer: string | null;

  @Column({ name: 'certificate_expires_at', type: 'timestamptz', nullable: true })
  certificateExpiresAt: Date | null;

  @Column({ name: 'certificate_registered_at', type: 'timestamptz', nullable: true })
  certificateRegisteredAt: Date | null;

  @Column({
    name: 'certificate_provider',
    type: 'enum',
    enum: CertificateProvider,
    enumName: 'certificate_provider_enum',
    nullable: true,
  })
  certificateProvider: CertificateProvider | null;

  @Column({ name: 'certificate_token', type: 'varchar', length: 500, nullable: true })
  certificateToken: string | null;

  @Column({ name: 'certificate_token_expires_at', type: 'timestamptz', nullable: true })
  certificateTokenExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
