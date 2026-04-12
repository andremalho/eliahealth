import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHospitalizations1711900062000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "admission_type_enum" AS ENUM ('obstetric','gynecologic','clinical')`);
    await queryRunner.query(`CREATE TYPE "admission_status_enum" AS ENUM ('active','discharged','transferred','death')`);
    await queryRunner.query(`CREATE TYPE "evolution_type_enum" AS ENUM ('medical','nursing','postpartum','surgical','discharge')`);

    await queryRunner.query(`
      CREATE TABLE "hospitalizations" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id" uuid,
        "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "pregnancy_id" uuid REFERENCES "pregnancies"("id") ON DELETE SET NULL,
        "attending_doctor_id" uuid NOT NULL REFERENCES "users"("id"),
        "admission_date" timestamptz NOT NULL,
        "discharge_date" timestamptz,
        "admission_type" "admission_type_enum" NOT NULL,
        "status" "admission_status_enum" NOT NULL DEFAULT 'active',
        "admission_diagnosis" text NOT NULL,
        "icd10_codes" jsonb,
        "bed" varchar,
        "ward" varchar,
        "discharge_summary" text,
        "discharge_diagnosis" text,
        "discharge_instructions" text,
        "alerts" jsonb,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "evolutions" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "hospitalization_id" uuid NOT NULL REFERENCES "hospitalizations"("id") ON DELETE CASCADE,
        "author_id" uuid NOT NULL REFERENCES "users"("id"),
        "type" "evolution_type_enum" NOT NULL DEFAULT 'medical',
        "evolution_date" timestamptz NOT NULL,
        "bp_systolic" int, "bp_diastolic" int, "heart_rate" int,
        "temperature" decimal(3,1), "respiratory_rate" int, "spo2" int,
        "diuresis_ml" int,
        "subjective" text, "objective" text, "assessment" text, "plan" text,
        "uterine_involution" varchar, "lochia_type" varchar,
        "wound_status" varchar, "breastfeeding" varchar,
        "medications" jsonb, "iv_fluids" text,
        "alerts" jsonb,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_hosp_patient" ON "hospitalizations" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX "idx_hosp_status" ON "hospitalizations" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_evo_hosp" ON "evolutions" ("hospitalization_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "evolutions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hospitalizations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "evolution_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admission_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admission_type_enum"`);
  }
}
