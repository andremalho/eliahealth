import { MigrationInterface, QueryRunner } from 'typeorm';

export class V2GuestsLabsPatientExams1711900034000
  implements MigrationInterface
{
  name = 'V2GuestsLabsPatientExams1711900034000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Guest Access ──
    await queryRunner.query(`
      CREATE TYPE "invite_method_enum" AS ENUM ('email', 'phone')
    `);
    await queryRunner.query(`
      CREATE TYPE "guest_access_type_enum" AS ENUM ('readonly', 'note_writer')
    `);

    await queryRunner.query(`
      CREATE TABLE "guest_access" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"    uuid NOT NULL,
        "granted_by"      uuid NOT NULL,
        "invite_method"   "invite_method_enum" NOT NULL,
        "invite_contact"  character varying NOT NULL,
        "access_type"     "guest_access_type_enum" NOT NULL DEFAULT 'readonly',
        "show_weight_chart" boolean NOT NULL DEFAULT false,
        "access_token"    uuid NOT NULL,
        "expires_at"      TIMESTAMP WITH TIME ZONE,
        "accepted_at"     TIMESTAMP WITH TIME ZONE,
        "revoked_at"      TIMESTAMP WITH TIME ZONE,
        "is_active"       boolean NOT NULL DEFAULT true,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_guest_access" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_guest_access_token" UNIQUE ("access_token"),
        CONSTRAINT "FK_guest_access_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_guest_access_token" ON "guest_access" ("access_token")`);

    // ── Lab Integrations ──
    await queryRunner.query(`
      CREATE TABLE "lab_integrations" (
        "id"                   uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"            uuid NOT NULL,
        "lab_name"             character varying NOT NULL,
        "lab_code"             character varying NOT NULL,
        "api_key"              character varying NOT NULL,
        "webhook_secret"       character varying NOT NULL,
        "is_active"            boolean NOT NULL DEFAULT true,
        "supported_exam_types" jsonb NOT NULL DEFAULT '[]',
        "created_at"           TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lab_integrations" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_lab_integrations_tenant_code" ON "lab_integrations" ("tenant_id", "lab_code")`);

    // ── Lab Webhook Logs ──
    await queryRunner.query(`
      CREATE TYPE "webhook_log_status_enum" AS ENUM ('received', 'matched', 'unmatched', 'error')
    `);
    await queryRunner.query(`
      CREATE TABLE "lab_webhook_logs" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "lab_integration_id"  uuid NOT NULL,
        "patient_identifier"  character varying NOT NULL,
        "payload"             jsonb NOT NULL,
        "processed_at"        TIMESTAMP WITH TIME ZONE,
        "status"              "webhook_log_status_enum" NOT NULL DEFAULT 'received',
        "error"               text,
        "created_at"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lab_webhook_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lab_webhook_logs_integration" FOREIGN KEY ("lab_integration_id")
          REFERENCES "lab_integrations"("id") ON DELETE CASCADE
      )
    `);

    // ── Lab Results: source + review_status columns ──
    const sourceCol = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_results' AND column_name = 'source'`,
    );
    if (sourceCol.length === 0) {
      await queryRunner.query(`ALTER TABLE "lab_results" ADD COLUMN "source" character varying DEFAULT 'physician'`);
    }

    const reviewCol = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_results' AND column_name = 'review_status'`,
    );
    if (reviewCol.length === 0) {
      await queryRunner.query(`ALTER TABLE "lab_results" ADD COLUMN "review_status" character varying DEFAULT 'confirmed'`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lab_results" DROP COLUMN IF EXISTS "review_status"`);
    await queryRunner.query(`ALTER TABLE "lab_results" DROP COLUMN IF EXISTS "source"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lab_webhook_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lab_integrations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "guest_access"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "webhook_log_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "guest_access_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invite_method_enum"`);
  }
}
