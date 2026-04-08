import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInitialAssessmentFields1711900044000 implements MigrationInterface {
  name = 'AddInitialAssessmentFields1711900044000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "pregnancies_diabetes_subtype_enum" AS ENUM ('dm1', 'dm2', 'lada', 'mody');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "pregnancies"
      ADD COLUMN IF NOT EXISTS "forceps_deliveries" int,
      ADD COLUMN IF NOT EXISTS "diabetes_subtype" "pregnancies_diabetes_subtype_enum",
      ADD COLUMN IF NOT EXISTS "personal_history" text,
      ADD COLUMN IF NOT EXISTS "gynecological_history" text,
      ADD COLUMN IF NOT EXISTS "first_consultation_completed_at" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pregnancies"
      DROP COLUMN IF EXISTS "forceps_deliveries",
      DROP COLUMN IF EXISTS "diabetes_subtype",
      DROP COLUMN IF EXISTS "personal_history",
      DROP COLUMN IF EXISTS "gynecological_history",
      DROP COLUMN IF EXISTS "first_consultation_completed_at"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "pregnancies_diabetes_subtype_enum"`);
  }
}
