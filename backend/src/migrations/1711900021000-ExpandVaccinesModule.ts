import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandVaccinesModule1711900021000
  implements MigrationInterface
{
  name = 'ExpandVaccinesModule1711900021000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'rhogam' to vaccine_type_enum
    await queryRunner.query(`
      ALTER TYPE "vaccine_type_enum"
      ADD VALUE IF NOT EXISTS 'rhogam'
    `);

    // Add new vaccine statuses
    await queryRunner.query(`
      ALTER TYPE "vaccine_status_enum"
      ADD VALUE IF NOT EXISTS 'pending'
    `);
    await queryRunner.query(`
      ALTER TYPE "vaccine_status_enum"
      ADD VALUE IF NOT EXISTS 'not_applicable'
    `);

    // Add multi-dose tracking columns
    await queryRunner.query(`
      ALTER TABLE "vaccines"
        ADD COLUMN "total_doses_required" integer,
        ADD COLUMN "dose_sequence" jsonb,
        ADD COLUMN "last_dose_date" date
    `);

    // Seed Rhogam into exam_schedules
    await queryRunner.query(`
      INSERT INTO "exam_schedules" (
        "exam_name", "exam_type", "ga_weeks_min", "ga_weeks_max",
        "ga_weeks_ideal", "trimester", "is_routine", "source", "notes"
      ) VALUES (
        'Rhogam (Imunoglobulina Anti-D)',
        'vaccine',
        28, 34, 30,
        '3rd',
        false,
        'FEBRASGO 2023',
        'Gestantes Rh negativo — administrar apos procedimentos invasivos (amniocentese, CVS) e no 3o trimestre (28-34 semanas) se Coombs indireto negativo. Dose: 300mcg IM'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "exam_schedules"
      WHERE "exam_name" = 'Rhogam (Imunoglobulina Anti-D)'
    `);

    await queryRunner.query(`
      ALTER TABLE "vaccines"
        DROP COLUMN "last_dose_date",
        DROP COLUMN "dose_sequence",
        DROP COLUMN "total_doses_required"
    `);

    // Enum values cannot be removed without recreating the type
  }
}
