import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUltrasoundReports1711900056000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "report_status_enum" AS ENUM ('draft','pending_signature','signed','exported')`);

    await queryRunner.query(`
      CREATE TABLE "ultrasound_reports" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id" uuid,
        "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "pregnancy_id" uuid REFERENCES "pregnancies"("id") ON DELETE SET NULL,
        "doctor_id" uuid NOT NULL REFERENCES "users"("id"),
        "template_id" varchar NOT NULL,
        "category" varchar NOT NULL,
        "report_date" date NOT NULL,
        "data" jsonb NOT NULL DEFAULT '{}',
        "status" "report_status_enum" NOT NULL DEFAULT 'draft',
        "ai_interpretation" text,
        "conclusion" text,
        "images" jsonb DEFAULT '[]',
        "signature_hash" varchar,
        "signed_at" timestamptz,
        "signed_by_name" varchar,
        "signed_by_crm" varchar,
        "exported_at" timestamptz,
        "exported_format" varchar,
        "sent_at" timestamptz,
        "sent_via" varchar,
        "sent_to" varchar,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_us_reports_patient" ON "ultrasound_reports" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX "idx_us_reports_pregnancy" ON "ultrasound_reports" ("pregnancy_id")`);
    await queryRunner.query(`CREATE INDEX "idx_us_reports_doctor" ON "ultrasound_reports" ("doctor_id")`);
    await queryRunner.query(`CREATE INDEX "idx_us_reports_status" ON "ultrasound_reports" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ultrasound_reports"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "report_status_enum"`);
  }
}
