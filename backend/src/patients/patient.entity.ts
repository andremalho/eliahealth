import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ unique: true })
  cpf: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'blood_type', type: 'varchar', nullable: true })
  bloodType: string | null;

  @Column({ name: 'zip_code', type: 'varchar', nullable: true })
  zipCode: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  height: number | null;

  @Column({ type: 'text', nullable: true })
  comorbidities: string | null;

  @Column({ type: 'text', nullable: true })
  allergies: string | null;

  @Column({ type: 'text', nullable: true })
  addictions: string | null;

  @Column({ type: 'text', nullable: true })
  surgeries: string | null;

  @Column({ name: 'family_history', type: 'text', nullable: true })
  familyHistory: string | null;

  @Column({ name: 'preferred_language', type: 'varchar', default: 'pt_BR' })
  preferredLanguage: string;

  @Column({
    name: 'lgpd_consent_at',
    type: 'timestamptz',
    nullable: true,
  })
  lgpdConsentAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
