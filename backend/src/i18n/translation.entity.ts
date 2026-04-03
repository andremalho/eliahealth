import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique,
} from 'typeorm';

export enum Language {
  PT_BR = 'pt_BR', EN_US = 'en_US', ES_ES = 'es_ES',
  FR_FR = 'fr_FR', DE_DE = 'de_DE', IT_IT = 'it_IT', JA_JP = 'ja_JP',
}

@Entity('translations')
@Unique(['key', 'language'])
export class Translation {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) key: string;
  @Column({ type: 'enum', enum: Language }) language: Language;
  @Column({ type: 'text' }) value: string;
  @Column({ type: 'varchar' }) category: string;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
