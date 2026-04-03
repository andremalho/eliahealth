import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOnboardingSteps1711900016000 implements MigrationInterface {
  name = 'CreateOnboardingSteps1711900016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "onboarding_step_enum" AS ENUM (
        'add_patient',
        'add_lab_exam',
        'add_ultrasound',
        'add_consultation',
        'patient_portal_access'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "onboarding_steps" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"       uuid NOT NULL,
        "step"          "onboarding_step_enum" NOT NULL,
        "completed_at"  TIMESTAMP WITH TIME ZONE,
        "is_completed"  boolean NOT NULL DEFAULT false,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_onboarding_steps" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_onboarding_user_step" UNIQUE ("user_id", "step"),
        CONSTRAINT "FK_onboarding_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_onboarding_user_id" ON "onboarding_steps" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "onboarding_steps"`);
    await queryRunner.query(`DROP TYPE "onboarding_step_enum"`);
  }
}
