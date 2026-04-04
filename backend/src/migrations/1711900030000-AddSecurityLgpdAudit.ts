import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecurityLgpdAudit1711900030000
  implements MigrationInterface
{
  name = 'AddSecurityLgpdAudit1711900030000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Audit logs ──
    await queryRunner.query(`
      CREATE TYPE "audit_action_enum" AS ENUM (
        'create', 'read', 'update', 'delete', 'export', 'share',
        'login', 'logout', 'failed_login'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"         uuid,
        "patient_id"      uuid,
        "pregnancy_id"    uuid,
        "action"          "audit_action_enum" NOT NULL,
        "resource"        character varying NOT NULL,
        "resource_id"     uuid,
        "ip_address"      character varying NOT NULL,
        "user_agent"      character varying,
        "request_data"    jsonb,
        "response_status" integer NOT NULL,
        "tenant_id"       uuid,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_patient_id" ON "audit_logs" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")`);

    // ── LGPD consents ──
    await queryRunner.query(`
      CREATE TYPE "consent_type_enum" AS ENUM (
        'data_processing', 'research', 'data_sharing', 'marketing'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "lgpd_consents" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id"    uuid NOT NULL,
        "consent_type"  "consent_type_enum" NOT NULL,
        "granted"       boolean NOT NULL,
        "granted_at"    TIMESTAMP WITH TIME ZONE,
        "revoked_at"    TIMESTAMP WITH TIME ZONE,
        "ip_address"    character varying NOT NULL,
        "version"       character varying NOT NULL,
        "term_text"     text NOT NULL,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lgpd_consents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lgpd_consents_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_lgpd_consents_patient_id" ON "lgpd_consents" ("patient_id")`);

    // ── Refresh tokens ──
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"     uuid NOT NULL,
        "token"       character varying NOT NULL,
        "expires_at"  TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at"  TIMESTAMP WITH TIME ZONE,
        "ip_address"  character varying NOT NULL,
        "user_agent"  character varying,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token")`);

    // ── Password history ──
    await queryRunner.query(`
      CREATE TABLE "password_history" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"        uuid NOT NULL,
        "password_hash"  character varying NOT NULL,
        "created_at"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_history_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_password_history_user_id" ON "password_history" ("user_id")`);

    // ── Research record data_hash ──
    const col = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'research_records' AND column_name = 'data_hash'
    `);
    if (col.length === 0) {
      await queryRunner.query(`ALTER TABLE "research_records" ADD COLUMN "data_hash" character varying`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "research_records" DROP COLUMN IF EXISTS "data_hash"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lgpd_consents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "consent_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "audit_action_enum"`);
  }
}
