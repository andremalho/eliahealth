import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnnotationsNotesExport1711900029000
  implements MigrationInterface
{
  name = 'AddAnnotationsNotesExport1711900029000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Notes: new fields ──
    await queryRunner.query(`
      ALTER TABLE "notes"
        ADD COLUMN "formatted_content" text,
        ADD COLUMN "is_shared_with_patient" boolean NOT NULL DEFAULT false
    `);

    // Update color default for existing rows
    await queryRunner.query(`
      UPDATE "notes" SET "color" = '#FFF4B8' WHERE "color" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "notes" ALTER COLUMN "color" SET DEFAULT '#FFF4B8'
    `);

    // ── Annotations table ──
    await queryRunner.query(`
      CREATE TABLE "annotations" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"          uuid NOT NULL,
        "author_id"             uuid NOT NULL,
        "content"               text NOT NULL,
        "is_visible_to_patient" boolean NOT NULL DEFAULT true,
        "is_visible_to_team"    boolean NOT NULL DEFAULT true,
        "created_at"            TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_annotations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_annotations_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_annotations_author" FOREIGN KEY ("author_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_annotations_pregnancy_id" ON "annotations" ("pregnancy_id")
    `);

    // ── Teams: add 'guest' role ──
    await queryRunner.query(`
      ALTER TYPE "team_role_enum" ADD VALUE IF NOT EXISTS 'guest'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "annotations"`);

    await queryRunner.query(`
      ALTER TABLE "notes"
        DROP COLUMN "is_shared_with_patient",
        DROP COLUMN "formatted_content"
    `);
  }
}
