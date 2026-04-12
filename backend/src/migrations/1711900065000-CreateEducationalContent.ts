import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEducationalContent1711900065000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "content_category_enum" AS ENUM ('pregnancy','postpartum','gynecology','menopause','fertility','nutrition','exercise','mental_health','general')`);
    await queryRunner.query(`CREATE TYPE "content_type_enum" AS ENUM ('article','video','checklist','faq')`);

    await queryRunner.query(`
      CREATE TABLE "educational_content" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "title" varchar NOT NULL,
        "body" text NOT NULL,
        "summary" text,
        "category" "content_category_enum" NOT NULL,
        "content_type" "content_type_enum" NOT NULL DEFAULT 'article',
        "tags" jsonb,
        "image_url" varchar,
        "video_url" varchar,
        "ga_week_min" int,
        "ga_week_max" int,
        "author_name" varchar,
        "is_published" boolean DEFAULT false,
        "sort_order" int DEFAULT 0,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_content_category" ON "educational_content" ("category", "is_published")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "educational_content"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_category_enum"`);
  }
}
