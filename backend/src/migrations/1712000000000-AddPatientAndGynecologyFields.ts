import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatientAndGynecologyFields1712000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Patient: demographic fields
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "marital_status" varchar`);
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "profession" varchar`);
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "education" varchar`);

    // Gynecology consultation type: add 'initial'
    await queryRunner.query(`ALTER TYPE "gynecology_consultation_type_enum" ADD VALUE IF NOT EXISTS 'initial' BEFORE 'routine'`);

    // Gynecology consultations: initial assessment data + family history extras
    await queryRunner.query(`ALTER TABLE "gynecology_consultations" ADD COLUMN IF NOT EXISTS "initial_assessment_data" jsonb`);
    await queryRunner.query(`ALTER TABLE "gynecology_consultations" ADD COLUMN IF NOT EXISTS "family_history_osteoporosis" boolean`);
    await queryRunner.query(`ALTER TABLE "gynecology_consultations" ADD COLUMN IF NOT EXISTS "family_history_hypertension" boolean`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "marital_status"`);
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "profession"`);
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "education"`);
    await queryRunner.query(`ALTER TABLE "gynecology_consultations" DROP COLUMN IF EXISTS "initial_assessment_data"`);
    await queryRunner.query(`ALTER TABLE "gynecology_consultations" DROP COLUMN IF EXISTS "family_history_osteoporosis"`);
    await queryRunner.query(`ALTER TABLE "gynecology_consultations" DROP COLUMN IF EXISTS "family_history_hypertension"`);
  }
}
