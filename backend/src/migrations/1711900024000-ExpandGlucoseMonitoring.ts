import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandGlucoseMonitoring1711900024000
  implements MigrationInterface
{
  name = 'ExpandGlucoseMonitoring1711900024000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new measurement types to enum
    await queryRunner.query(`
      ALTER TYPE "measurement_type_enum"
      ADD VALUE IF NOT EXISTS 'pre_lunch'
    `);
    await queryRunner.query(`
      ALTER TYPE "measurement_type_enum"
      ADD VALUE IF NOT EXISTS 'pre_dinner'
    `);

    // Add readingDateTime column
    await queryRunner.query(`
      ALTER TABLE "glucose_readings"
        ADD COLUMN "reading_date_time" TIMESTAMP WITH TIME ZONE
    `);

    // Backfill readingDateTime from existing date + time
    await queryRunner.query(`
      UPDATE "glucose_readings"
      SET "reading_date_time" = ("reading_date"::text || 'T' || "reading_time"::text)::timestamptz
      WHERE "reading_date_time" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "glucose_readings"
        DROP COLUMN "reading_date_time"
    `);

    // Enum values cannot be removed without recreating the type
  }
}
