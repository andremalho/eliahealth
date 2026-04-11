import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorSchedules1711900057000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "doctor_schedules" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "doctor_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "day_of_week" int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "slot_duration_min" int NOT NULL DEFAULT 30,
        "is_active" boolean DEFAULT true,
        "created_at" timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_doctor_schedules_doctor" ON "doctor_schedules" ("doctor_id", "is_active")`);

    await queryRunner.query(`
      CREATE TABLE "doctor_blocked_dates" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "doctor_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "blocked_date" date NOT NULL,
        "reason" varchar,
        "created_at" timestamptz DEFAULT now(),
        UNIQUE("doctor_id", "blocked_date")
      )
    `);

    // Add reminder tracking to appointments
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "reminder_48h_sent" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "reminder_24h_sent" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "booked_by_patient" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "auto_scheduled" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "pregnancy_id" uuid REFERENCES "pregnancies"("id") ON DELETE SET NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "pregnancy_id"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "auto_scheduled"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "booked_by_patient"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "reminder_24h_sent"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "reminder_48h_sent"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "doctor_blocked_dates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "doctor_schedules"`);
  }
}
