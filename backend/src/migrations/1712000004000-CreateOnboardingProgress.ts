import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOnboardingProgress1712000004000 implements MigrationInterface {
  name = 'CreateOnboardingProgress1712000004000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "onboarding_progress" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL,
        "tenant_id" UUID,
        "flow_name" VARCHAR(50) NOT NULL,
        "current_step" INT NOT NULL DEFAULT 0,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "skipped" BOOLEAN NOT NULL DEFAULT false,
        "completed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("user_id", "flow_name")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_onboarding_user" ON "onboarding_progress"("user_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "onboarding_progress"`);
  }
}
