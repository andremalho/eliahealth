import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pregnancy } from '../pregnancies/pregnancy.entity.js';
import { UltrasoundSummary } from '../ultrasound/ultrasound-summary.entity.js';
import {
  NiptResult,
  KaryotypeMethod,
  KaryotypeClassification,
  GenomicResult,
  ExomeType,
} from './genetic-counseling.enums.js';

// SENSÍVEL: este módulo contém dados genéticos protegidos.
// TODO: implementar permissão especial — apenas médico responsável pode acessar.

@Entity('genetic_counselings')
export class GeneticCounseling {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid' })
  pregnancyId: string;

  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy;

  @Column({ name: 'ultrasound_summary_id', type: 'uuid', nullable: true })
  ultrasoundSummaryId: string | null;

  @ManyToOne(() => UltrasoundSummary, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ultrasound_summary_id' })
  ultrasoundSummary: UltrasoundSummary | null;

  @Column({ name: 'counseling_date', type: 'date' })
  counselingDate: string;

  @Column({ name: 'indication_reason', type: 'text' })
  indicationReason: string;

  @Column({ name: 'geneticist_name', type: 'varchar', nullable: true })
  geneticistName: string | null;

  // ── NIPT ──

  @Column({ name: 'nipt_date', type: 'date', nullable: true })
  niptDate: string | null;

  @Column({ name: 'nipt_lab', type: 'varchar', nullable: true })
  niptLab: string | null;

  @Column({ name: 'nipt_t21_risk', type: 'varchar', nullable: true })
  niptT21Risk: string | null;

  @Column({ name: 'nipt_t21_result', type: 'enum', enum: NiptResult, nullable: true })
  niptT21Result: NiptResult | null;

  @Column({ name: 'nipt_t18_result', type: 'enum', enum: NiptResult, nullable: true })
  niptT18Result: NiptResult | null;

  @Column({ name: 'nipt_t13_result', type: 'enum', enum: NiptResult, nullable: true })
  niptT13Result: NiptResult | null;

  @Column({ name: 'nipt_sex_chromosomes', type: 'varchar', nullable: true })
  niptSexChromosomes: string | null;

  @Column({ name: 'nipt_microdeletions', type: 'jsonb', nullable: true })
  niptMicrodeletions: Record<string, unknown> | null;

  @Column({ name: 'nipt_raw_report', type: 'text', nullable: true })
  niptRawReport: string | null;

  // ── Cariótipo ──

  @Column({ name: 'karyotype_date', type: 'date', nullable: true })
  karyotypeDate: string | null;

  @Column({ name: 'karyotype_lab', type: 'varchar', nullable: true })
  karyotypeLab: string | null;

  @Column({ name: 'karyotype_method', type: 'enum', enum: KaryotypeMethod, nullable: true })
  karyotypeMethod: KaryotypeMethod | null;

  @Column({ name: 'karyotype_result', type: 'varchar', nullable: true })
  karyotypeResult: string | null;

  @Column({ name: 'karyotype_classification', type: 'enum', enum: KaryotypeClassification, nullable: true })
  karyotypeClassification: KaryotypeClassification | null;

  @Column({ name: 'karyotype_findings', type: 'text', nullable: true })
  karyotypeFindings: string | null;

  // ── Microarray ──

  @Column({ name: 'microarray_date', type: 'date', nullable: true })
  microarrayDate: string | null;

  @Column({ name: 'microarray_lab', type: 'varchar', nullable: true })
  microarrayLab: string | null;

  @Column({ name: 'microarray_platform', type: 'varchar', nullable: true })
  microarrayPlatform: string | null;

  @Column({ name: 'microarray_result', type: 'enum', enum: GenomicResult, nullable: true })
  microarrayResult: GenomicResult | null;

  @Column({ name: 'microarray_findings', type: 'text', nullable: true })
  microarrayFindings: string | null;

  @Column({ name: 'microarray_raw_report', type: 'text', nullable: true })
  microarrayRawReport: string | null;

  // ── Exoma ──

  @Column({ name: 'exome_date', type: 'date', nullable: true })
  exomeDate: string | null;

  @Column({ name: 'exome_lab', type: 'varchar', nullable: true })
  exomeLab: string | null;

  @Column({ name: 'exome_type', type: 'enum', enum: ExomeType, nullable: true })
  exomeType: ExomeType | null;

  @Column({ name: 'exome_result', type: 'enum', enum: GenomicResult, nullable: true })
  exomeResult: GenomicResult | null;

  @Column({ name: 'exome_gene', type: 'varchar', nullable: true })
  exomeGene: string | null;

  @Column({ name: 'exome_variant', type: 'varchar', nullable: true })
  exomeVariant: string | null;

  @Column({ name: 'exome_findings', type: 'text', nullable: true })
  exomeFindings: string | null;

  @Column({ name: 'exome_raw_report', type: 'text', nullable: true })
  exomeRawReport: string | null;

  // ── Conclusão ──

  @Column({ name: 'overall_conclusion', type: 'text', nullable: true })
  overallConclusion: string | null;

  @Column({ name: 'recommended_actions', type: 'jsonb', nullable: true })
  recommendedActions: string[] | null;

  @Column({ name: 'follow_up_date', type: 'date', nullable: true })
  followUpDate: string | null;

  @Column({ name: 'attachment_urls', type: 'jsonb', nullable: true })
  attachmentUrls: string[] | null;

  @Column({ name: 'ai_interpretation', type: 'text', nullable: true })
  aiInterpretation: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
