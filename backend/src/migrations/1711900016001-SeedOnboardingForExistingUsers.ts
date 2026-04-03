import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedOnboardingForExistingUsers1711900016001
  implements MigrationInterface
{
  name = 'SeedOnboardingForExistingUsers1711900016001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const steps = [
      'add_patient',
      'add_lab_exam',
      'add_ultrasound',
      'add_consultation',
      'patient_portal_access',
    ];

    for (const step of steps) {
      await queryRunner.query(`
        INSERT INTO "onboarding_steps" ("user_id", "step")
        SELECT u."id", '${step}'::"onboarding_step_enum"
        FROM "users" u
        WHERE NOT EXISTS (
          SELECT 1 FROM "onboarding_steps" os
          WHERE os."user_id" = u."id" AND os."step" = '${step}'::"onboarding_step_enum"
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "onboarding_steps"`);
  }
}
