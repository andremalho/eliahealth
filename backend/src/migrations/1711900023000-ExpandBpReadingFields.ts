import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandBpReadingFields1711900023000
  implements MigrationInterface
{
  name = 'ExpandBpReadingFields1711900023000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "bp_measurement_location_enum" AS ENUM (
        'home', 'consultation', 'pharmacy', 'hospital', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "bp_measurement_method_enum" AS ENUM (
        'manual', 'digital_wrist', 'digital_arm', 'automatic_device'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "bp_readings"
        ADD COLUMN "reading_date_time" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "measurement_location" "bp_measurement_location_enum" NOT NULL DEFAULT 'home',
        ADD COLUMN "measurement_method" "bp_measurement_method_enum" NOT NULL DEFAULT 'manual',
        ADD COLUMN "device_id" character varying,
        ADD COLUMN "gestational_age_days" integer
    `);

    // Backfill readingDateTime from existing date + time columns
    await queryRunner.query(`
      UPDATE "bp_readings"
      SET "reading_date_time" = ("reading_date"::text || 'T' || "reading_time"::text)::timestamptz
      WHERE "reading_date_time" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bp_readings"
        DROP COLUMN "gestational_age_days",
        DROP COLUMN "device_id",
        DROP COLUMN "measurement_method",
        DROP COLUMN "measurement_location",
        DROP COLUMN "reading_date_time"
    `);

    await queryRunner.query(`DROP TYPE "bp_measurement_method_enum"`);
    await queryRunner.query(`DROP TYPE "bp_measurement_location_enum"`);
  }
}
