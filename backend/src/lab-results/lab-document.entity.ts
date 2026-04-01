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
import { DocumentType, FileType } from './lab-result.enums.js';

@Entity('lab_documents')
export class LabDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pregnancy_id', type: 'uuid', nullable: true })
  pregnancyId: string | null;

  @ManyToOne(() => Pregnancy, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'pregnancy_id' })
  pregnancy: Pregnancy | null;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ name: 'document_type', type: 'enum', enum: DocumentType })
  documentType: DocumentType;

  @Column({ type: 'varchar' })
  category: string;

  @Column({ name: 'file_url', type: 'varchar' })
  fileUrl: string;

  @Column({ name: 'file_type', type: 'enum', enum: FileType })
  fileType: FileType;

  // TODO: OCR/IA — preencher este campo com texto extraído do PDF/imagem para uso como contexto em análises de IA
  @Column({ name: 'extracted_text', type: 'text', nullable: true })
  extractedText: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
