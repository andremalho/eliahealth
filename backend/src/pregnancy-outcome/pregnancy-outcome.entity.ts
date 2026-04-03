import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';

export enum DeliveryType { VAGINAL = 'vaginal', CESAREAN = 'cesarean', FORCEPS = 'forceps', VACUUM = 'vacuum' }

@Entity('pregnancy_outcomes')
export class PregnancyOutcome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid', unique: true })
  pregnancyId: string;

  @OneToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ name: 'delivery_date', type: 'date' })
  deliveryDate: string;

  @Column({ name: 'delivery_type', type: 'enum', enum: DeliveryType })
  deliveryType: DeliveryType;

  @Column({ name: 'delivery_indication', type: 'varchar', nullable: true })
  deliveryIndication: string | null;

  @Column({ name: 'gestational_age_at_delivery', type: 'int' })
  gestationalAgeAtDelivery: number;

  @Column({ name: 'hospital_name', type: 'varchar', nullable: true })
  hospitalName: string | null;

  @Column({ name: 'neonatal_data', type: 'jsonb', default: [] })
  neonatalData: Record<string, unknown>[];

  @Column({ name: 'maternal_complications', type: 'jsonb', nullable: true })
  maternalComplications: string[] | null;

  @Column({ name: 'maternal_complications_notes', type: 'text', nullable: true })
  maternalComplicationsNotes: string | null;

  @Column({ name: 'blood_loss_estimated', type: 'int', nullable: true })
  bloodLossEstimated: number | null;

  @Column({ name: 'placenta_weight', type: 'int', nullable: true })
  placentaWeight: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
