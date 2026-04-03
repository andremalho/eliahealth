import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClinicalSelectionFields1711900019000
  implements MigrationInterface
{
  name = 'AddClinicalSelectionFields1711900019000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
        ADD COLUMN "comorbidities_selected" jsonb,
        ADD COLUMN "comorbidities_notes" text,
        ADD COLUMN "allergies_selected" jsonb,
        ADD COLUMN "allergies_notes" text,
        ADD COLUMN "addictions_selected" jsonb,
        ADD COLUMN "addictions_notes" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
        DROP COLUMN "addictions_notes",
        DROP COLUMN "addictions_selected",
        DROP COLUMN "allergies_notes",
        DROP COLUMN "allergies_selected",
        DROP COLUMN "comorbidities_notes",
        DROP COLUMN "comorbidities_selected"
    `);
  }
}
