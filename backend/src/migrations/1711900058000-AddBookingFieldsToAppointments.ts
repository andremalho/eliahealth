import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingFieldsToAppointments1711900058000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Appointment booking fields
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "insurance_type" varchar`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "insurance_provider" varchar`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "insurance_member_id" varchar`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "insurance_plan" varchar`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "insurance_card_url" varchar`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "exam_request_url" varchar`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "patient_cpf" varchar`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "patient_cep" varchar`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "is_checked_in" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "checked_in_at" timestamptz`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "checkin_token" varchar UNIQUE`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "documents_confirmed" boolean DEFAULT false`);

    // Appointment alerts
    await queryRunner.query(`CREATE TYPE "alert_status_enum" AS ENUM ('pending','scheduled','expired')`);
    await queryRunner.query(`
      CREATE TABLE "appointment_alerts" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "pregnancy_id" uuid REFERENCES "pregnancies"("id") ON DELETE SET NULL,
        "requested_by" uuid NOT NULL REFERENCES "users"("id"),
        "appointment_type" varchar NOT NULL,
        "ga_window_min" int,
        "ga_window_max" int,
        "message" text,
        "status" "alert_status_enum" NOT NULL DEFAULT 'pending',
        "scheduled_appointment_id" uuid REFERENCES "appointments"("id") ON DELETE SET NULL,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_appt_alerts_patient" ON "appointment_alerts" ("patient_id", "status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "appointment_alerts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alert_status_enum"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "documents_confirmed"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "checkin_token"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "checked_in_at"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "is_checked_in"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "patient_cep"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "patient_cpf"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "exam_request_url"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "insurance_card_url"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "insurance_plan"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "insurance_member_id"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "insurance_provider"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "insurance_type"`);
  }
}
