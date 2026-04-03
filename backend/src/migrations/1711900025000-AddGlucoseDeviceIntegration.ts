import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGlucoseDeviceIntegration1711900025000
  implements MigrationInterface
{
  name = 'AddGlucoseDeviceIntegration1711900025000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // New reading source values
    const newSources = ['device_bluetooth', 'device_api', 'device_usb'];
    for (const val of newSources) {
      await queryRunner.query(
        `ALTER TYPE "reading_source_enum" ADD VALUE IF NOT EXISTS '${val}'`,
      );
    }

    // Integration protocol enum
    await queryRunner.query(`
      CREATE TYPE "integration_protocol_enum" AS ENUM ('bluetooth', 'api', 'usb', 'nfc')
    `);

    // New columns on glucose_readings
    await queryRunner.query(`
      ALTER TABLE "glucose_readings"
        ADD COLUMN "device_reading_id" character varying,
        ADD COLUMN "raw_device_data" jsonb
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_glucose_readings_device_reading_id"
        ON "glucose_readings" ("device_reading_id")
        WHERE "device_reading_id" IS NOT NULL
    `);

    // Expand glucose_monitoring_configs — replace old device_integration_id with new fields
    await queryRunner.query(`
      ALTER TABLE "glucose_monitoring_configs"
        ADD COLUMN "device_integration_enabled" boolean NOT NULL DEFAULT false,
        ADD COLUMN "device_model" character varying,
        ADD COLUMN "device_serial_number" character varying,
        ADD COLUMN "integration_protocol" "integration_protocol_enum",
        ADD COLUMN "integration_api_key" character varying,
        ADD COLUMN "last_sync_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "auto_sync_enabled" boolean NOT NULL DEFAULT false
    `);

    // Drop old column if it exists
    const hasOldCol = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'glucose_monitoring_configs' AND column_name = 'device_integration_id'
    `);
    if (hasOldCol.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "glucose_monitoring_configs" DROP COLUMN "device_integration_id"
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "glucose_monitoring_configs"
        ADD COLUMN "device_integration_id" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "glucose_monitoring_configs"
        DROP COLUMN "auto_sync_enabled",
        DROP COLUMN "last_sync_at",
        DROP COLUMN "integration_api_key",
        DROP COLUMN "integration_protocol",
        DROP COLUMN "device_serial_number",
        DROP COLUMN "device_model",
        DROP COLUMN "device_integration_enabled"
    `);

    await queryRunner.query(`
      DROP INDEX "UQ_glucose_readings_device_reading_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "glucose_readings"
        DROP COLUMN "raw_device_data",
        DROP COLUMN "device_reading_id"
    `);

    await queryRunner.query(`DROP TYPE "integration_protocol_enum"`);
  }
}
