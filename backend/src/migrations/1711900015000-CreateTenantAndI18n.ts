import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantAndI18n1711900015000 implements MigrationInterface {
  name = 'CreateTenantAndI18n1711900015000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── superadmin role ──
    await queryRunner.query(`ALTER TYPE "user_role_enum" ADD VALUE IF NOT EXISTS 'superadmin'`);

    // ── tenants ──
    await queryRunner.query(`CREATE TYPE "tenant_plan_enum" AS ENUM ('eliahealth','white_label_basic','white_label_pro','enterprise')`);
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"                character varying NOT NULL,
        "slug"                character varying NOT NULL,
        "logo_url"            character varying,
        "primary_color"       character varying,
        "secondary_color"     character varying,
        "custom_domain"       character varying,
        "powered_by_visible"  boolean NOT NULL DEFAULT true,
        "powered_by_text"     character varying NOT NULL DEFAULT 'Powered by EliaHealth',
        "plan"                "tenant_plan_enum" NOT NULL DEFAULT 'eliahealth',
        "is_active"           boolean NOT NULL DEFAULT true,
        "max_users"           integer NOT NULL DEFAULT 5,
        "max_patients"        integer NOT NULL DEFAULT 100,
        "features"            jsonb NOT NULL DEFAULT '[]',
        "contact_email"       character varying NOT NULL,
        "contact_phone"       character varying,
        "address"             character varying,
        "cnpj"                character varying,
        "created_at"          TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug")
      )
    `);

    // Seed tenant EliaHealth
    await queryRunner.query(`
      INSERT INTO "tenants" ("name", "slug", "plan", "powered_by_visible", "max_users", "max_patients",
        "features", "contact_email")
      SELECT 'EliaHealth', 'eliahealth', 'eliahealth', false, 9999, 999999,
        '["prenatal","screening_fmf","ai_copilot","research","ultrasound","genetic_counseling","glucose_monitoring","bp_monitoring"]',
        'admin@eliahealth.com'
      WHERE NOT EXISTS (SELECT 1 FROM "tenants" WHERE "slug" = 'eliahealth')
    `);

    // ── tenantId em entidades principais ──
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);
    await queryRunner.query(`ALTER TABLE "pregnancies" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);
    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_patients_tenant_id" ON "patients" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pregnancies_tenant_id" ON "pregnancies" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_consultations_tenant_id" ON "consultations" ("tenant_id")`);

    // ── translations ──
    await queryRunner.query(`
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'language_enum') THEN
        CREATE TYPE "language_enum" AS ENUM ('pt_BR','en_US','es_ES','fr_FR','de_DE','it_IT','ja_JP');
      END IF; END $$
    `);
    await queryRunner.query(`
      CREATE TABLE "translations" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key"         character varying NOT NULL,
        "language"    "language_enum" NOT NULL,
        "value"       text NOT NULL,
        "category"    character varying NOT NULL,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_translations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_translations_key_language" UNIQUE ("key", "language")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_translations_language" ON "translations" ("language")`);
    await queryRunner.query(`CREATE INDEX "IDX_translations_category" ON "translations" ("language", "category")`);

    // ── preferredLanguage ──
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferred_language" character varying NOT NULL DEFAULT 'pt_BR'`);
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "preferred_language" character varying NOT NULL DEFAULT 'pt_BR'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "preferred_language"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "preferred_language"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "translations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "language_enum"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consultations_tenant_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pregnancies_tenant_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_patients_tenant_id"`);
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "pregnancies" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tenant_plan_enum"`);
  }
}
