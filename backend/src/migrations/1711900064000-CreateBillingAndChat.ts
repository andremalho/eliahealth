import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBillingAndChat1711900064000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Billing
    await queryRunner.query(`CREATE TYPE "billing_status_enum" AS ENUM ('draft','submitted','approved','denied','appealed','paid')`);
    await queryRunner.query(`CREATE TYPE "guide_type_enum" AS ENUM ('sadt','consultation','hospitalization','honor')`);

    await queryRunner.query(`
      CREATE TABLE "billing_records" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id" uuid,
        "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "guide_type" "guide_type_enum" NOT NULL,
        "guide_number" varchar,
        "status" "billing_status_enum" NOT NULL DEFAULT 'draft',
        "insurance_provider" varchar,
        "insurance_member_id" varchar,
        "authorization_number" varchar,
        "procedures" jsonb DEFAULT '[]',
        "total_value" decimal(10,2) DEFAULT 0,
        "service_date" date NOT NULL,
        "submitted_at" timestamptz,
        "paid_at" timestamptz,
        "paid_value" decimal(10,2),
        "denial_reason" text,
        "notes" text,
        "tiss_xml" text,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_billing_patient" ON "billing_records" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX "idx_billing_status" ON "billing_records" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "billing_records"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "guide_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "billing_status_enum"`);
  }
}
