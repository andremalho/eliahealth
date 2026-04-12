import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ContentCategory {
  PREGNANCY = 'pregnancy',
  POSTPARTUM = 'postpartum',
  GYNECOLOGY = 'gynecology',
  MENOPAUSE = 'menopause',
  FERTILITY = 'fertility',
  NUTRITION = 'nutrition',
  EXERCISE = 'exercise',
  MENTAL_HEALTH = 'mental_health',
  GENERAL = 'general',
}

export enum ContentType {
  ARTICLE = 'article',
  VIDEO = 'video',
  CHECKLIST = 'checklist',
  FAQ = 'faq',
}

@Entity('educational_content')
export class EducationalContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'enum', enum: ContentCategory })
  category: ContentCategory;

  @Column({ type: 'enum', enum: ContentType, default: ContentType.ARTICLE })
  contentType: ContentType;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[] | null;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'video_url', type: 'varchar', nullable: true })
  videoUrl: string | null;

  @Column({ name: 'ga_week_min', type: 'int', nullable: true })
  gaWeekMin: number | null;

  @Column({ name: 'ga_week_max', type: 'int', nullable: true })
  gaWeekMax: number | null;

  @Column({ name: 'author_name', type: 'varchar', nullable: true })
  authorName: string | null;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
