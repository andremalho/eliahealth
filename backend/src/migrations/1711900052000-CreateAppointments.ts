import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointments1711900052000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "appointment_status_enum" AS ENUM ('scheduled','confirmed','arrived','in_progress','completed','cancelled','no_show')`);
    await queryRunner.query(`CREATE TYPE "appointment_type_enum" AS ENUM ('consultation','follow_up','exam','procedure','other')`);

    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id" uuid,
        "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "doctor_id" uuid NOT NULL REFERENCES "users"("id"),
        "created_by_id" uuid REFERENCES "users"("id"),
        "date" date NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "type" "appointment_type_enum" NOT NULL DEFAULT 'consultation',
        "status" "appointment_status_enum" NOT NULL DEFAULT 'scheduled',
        "notes" text,
        "cancellation_reason" text,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_appointments_tenant_date" ON "appointments" ("tenant_id", "date")`);
    await queryRunner.query(`CREATE INDEX "idx_appointments_doctor_date" ON "appointments" ("doctor_id", "date")`);
    await queryRunner.query(`CREATE INDEX "idx_appointments_patient" ON "appointments" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX "idx_appointments_status" ON "appointments" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_status_enum"`);
  }
}
