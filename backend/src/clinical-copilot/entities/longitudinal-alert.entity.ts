import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('longitudinal_alerts')
export class LongitudinalAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId: string | null;

  @Column({ name: 'alert_type', type: 'varchar', length: 50 })
  alertType: string;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'suggested_action', type: 'text', nullable: true })
  suggestedAction: string | null;

  @Column({ type: 'varchar', length: 20, default: 'attention' })
  severity: string;

  @Column({ name: 'read_by_doctor', type: 'boolean', default: false })
  readByDoctor: boolean;

  @Column({ name: 'acted_upon', type: 'boolean', default: false })
  actedUpon: boolean;

  @Column({ name: 'doctor_response', type: 'text', nullable: true })
  doctorResponse: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
