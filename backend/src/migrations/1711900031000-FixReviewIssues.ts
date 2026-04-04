import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixReviewIssues1711900031000
  implements MigrationInterface
{
  name = 'FixReviewIssues1711900031000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Guest shares table (replaces misuse of pregnancy_shares for guests) ──
    await queryRunner.query(`
      CREATE TABLE "guest_shares" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"    uuid NOT NULL,
        "shared_by"       uuid NOT NULL,
        "guest_name"      character varying NOT NULL,
        "guest_email"     character varying NOT NULL,
        "access_token"    character varying NOT NULL,
        "permission"      character varying NOT NULL DEFAULT 'view_only',
        "expires_at"      TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_guest_shares" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_guest_shares_access_token" UNIQUE ("access_token"),
        CONSTRAINT "FK_guest_shares_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_guest_shares_user" FOREIGN KEY ("shared_by")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_guest_shares_access_token" ON "guest_shares" ("access_token")
    `);

    // ── Migrate old edema values to new ones ──
    // PostgreSQL requires a transaction boundary after ADD VALUE on enums
    // (the new values were added in migration 1711900026000)
    // Commit current transaction so new enum values are visible, then restart
    await queryRunner.query(`COMMIT`);
    await queryRunner.query(`BEGIN`);

    await queryRunner.query(`
      UPDATE "consultations" SET "edema_grade" = 'absent' WHERE "edema_grade" = 'none'
    `);
    await queryRunner.query(`
      UPDATE "consultations" SET "edema_grade" = '1plus' WHERE "edema_grade" = '1+'
    `);
    await queryRunner.query(`
      UPDATE "consultations" SET "edema_grade" = '2plus' WHERE "edema_grade" = '2+'
    `);
    await queryRunner.query(`
      UPDATE "consultations" SET "edema_grade" = '3plus' WHERE "edema_grade" = '3+'
    `);
    await queryRunner.query(`
      UPDATE "consultations" SET "edema_grade" = '4plus' WHERE "edema_grade" = '4+'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "consultations" SET "edema_grade" = 'none' WHERE "edema_grade" = 'absent'
    `);
    await queryRunner.query(`
      UPDATE "consultations" SET "edema_grade" = '1+' WHERE "edema_grade" = '1plus'
    `);
    await queryRunner.query(`
      UPDATE "consultations" SET "edema_grade" = '2+' WHERE "edema_grade" = '2plus'
    `);
    await queryRunner.query(`
      UPDATE "consultations" SET "edema_grade" = '3+' WHERE "edema_grade" = '3plus'
    `);
    await queryRunner.query(`
      UPDATE "consultations" SET "edema_grade" = '4+' WHERE "edema_grade" = '4plus'
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "guest_shares"`);
  }
}
