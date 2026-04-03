import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldsToPregnancyPatientConsultation1711900013000 implements MigrationInterface {
  name = 'AddFieldsToPregnancyPatientConsultation1711900013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Pregnancy: 7 novos campos ──
    await queryRunner.query(`ALTER TABLE "pregnancies" ADD COLUMN IF NOT EXISTS "is_high_risk" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "pregnancies" ADD COLUMN IF NOT EXISTS "current_pathologies" text`);
    await queryRunner.query(`ALTER TABLE "pregnancies" ADD COLUMN IF NOT EXISTS "current_medications" text`);
    await queryRunner.query(`ALTER TABLE "pregnancies" ADD COLUMN IF NOT EXISTS "habits" text`);
    await queryRunner.query(`ALTER TABLE "pregnancies" ADD COLUMN IF NOT EXISTS "cesareans" integer`);
    await queryRunner.query(`ALTER TABLE "pregnancies" ADD COLUMN IF NOT EXISTS "vaginal_deliveries" integer`);
    await queryRunner.query(`ALTER TABLE "pregnancies" ADD COLUMN IF NOT EXISTS "previous_pregnancies_notes" text`);

    // ── Patient: 6 novos campos (zipCode já existe) ──
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "height" numeric(5,1)`);
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "comorbidities" text`);
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "allergies" text`);
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "addictions" text`);
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "surgeries" text`);
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "family_history" text`);

    // ── Consultation: 9 novos campos + 2 enums ──
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fetal_presentation_enum') THEN CREATE TYPE "fetal_presentation_enum" AS ENUM ('cephalic','pelvic','transverse','not_evaluated'); END IF; END $$`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'umbilical_doppler_result_enum') THEN CREATE TYPE "umbilical_doppler_result_enum" AS ENUM ('normal','altered','not_performed'); END IF; END $$`);

    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "fetal_movements" character varying`);
    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "vaginal_exam" character varying`);
    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "fetal_presentation" "fetal_presentation_enum"`);
    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "estimated_fetal_weight" character varying`);
    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "umbilical_doppler" "umbilical_doppler_result_enum"`);
    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "biophysical_profile" integer`);
    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "physical_exam_notes" text`);
    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "next_appointment_date" date`);
    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "confidential_notes" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Consultation
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "confidential_notes"`);
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "next_appointment_date"`);
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "physical_exam_notes"`);
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "biophysical_profile"`);
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "umbilical_doppler"`);
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "estimated_fetal_weight"`);
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "fetal_presentation"`);
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "vaginal_exam"`);
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "fetal_movements"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "umbilical_doppler_result_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "fetal_presentation_enum"`);

    // Patient
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "family_history"`);
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "surgeries"`);
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "addictions"`);
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "allergies"`);
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "comorbidities"`);
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "height"`);

    // Pregnancy
    await queryRunner.query(`ALTER TABLE "pregnancies" DROP COLUMN IF EXISTS "previous_pregnancies_notes"`);
    await queryRunner.query(`ALTER TABLE "pregnancies" DROP COLUMN IF EXISTS "vaginal_deliveries"`);
    await queryRunner.query(`ALTER TABLE "pregnancies" DROP COLUMN IF EXISTS "cesareans"`);
    await queryRunner.query(`ALTER TABLE "pregnancies" DROP COLUMN IF EXISTS "habits"`);
    await queryRunner.query(`ALTER TABLE "pregnancies" DROP COLUMN IF EXISTS "current_medications"`);
    await queryRunner.query(`ALTER TABLE "pregnancies" DROP COLUMN IF EXISTS "current_pathologies"`);
    await queryRunner.query(`ALTER TABLE "pregnancies" DROP COLUMN IF EXISTS "is_high_risk"`);
  }
}
