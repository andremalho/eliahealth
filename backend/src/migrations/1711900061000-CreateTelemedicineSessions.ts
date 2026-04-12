import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTelemedicineSessions1711900061000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "call_status_enum" AS ENUM ('waiting','in_progress','completed','cancelled','no_show')`);
    await queryRunner.query(`
      CREATE TABLE "telemedicine_sessions" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id" uuid,
        "appointment_id" uuid REFERENCES "appointments"("id") ON DELETE SET NULL,
        "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "doctor_id" uuid NOT NULL REFERENCES "users"("id"),
        "room_name" varchar UNIQUE NOT NULL,
        "room_url" varchar,
        "doctor_token" varchar,
        "patient_token" varchar,
        "status" "call_status_enum" NOT NULL DEFAULT 'waiting',
        "started_at" timestamptz,
        "ended_at" timestamptz,
        "duration_seconds" int,
        "notes" text,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_telemed_patient" ON "telemedicine_sessions" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX "idx_telemed_doctor" ON "telemedicine_sessions" ("doctor_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "telemedicine_sessions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "call_status_enum"`);
  }
}
