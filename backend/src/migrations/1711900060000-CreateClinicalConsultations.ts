import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicalConsultations1711900060000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "clinical_consultations" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id" uuid,
        "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "doctor_id" uuid REFERENCES "users"("id"),
        "date" date NOT NULL,
        "specialty" varchar,
        "bp_systolic" int,
        "bp_diastolic" int,
        "heart_rate" int,
        "temperature" decimal(3,1),
        "respiratory_rate" int,
        "spo2" int,
        "weight_kg" decimal(5,2),
        "height_cm" decimal(5,1),
        "subjective" text,
        "objective" text,
        "assessment" text,
        "plan" text,
        "icd10_codes" jsonb,
        "diagnosis" text,
        "prescriptions" jsonb,
        "requested_exams" jsonb,
        "referral" text,
        "confidential_notes" text,
        "next_appointment_date" date,
        "alerts" jsonb,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_clinical_consultations_patient" ON "clinical_consultations" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX "idx_clinical_consultations_doctor" ON "clinical_consultations" ("doctor_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "clinical_consultations"`);
  }
}
