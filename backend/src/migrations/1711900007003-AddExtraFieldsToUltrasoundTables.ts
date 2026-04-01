import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtraFieldsToUltrasoundTables1711900007003 implements MigrationInterface {
  name = 'AddExtraFieldsToUltrasoundTables1711900007003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ultrasounds" ADD COLUMN IF NOT EXISTS "template_version" character varying`);
    await queryRunner.query(`ALTER TABLE "ultrasounds" ADD COLUMN IF NOT EXISTS "extra_fields" jsonb`);
    await queryRunner.query(`ALTER TABLE "fetal_biometries" ADD COLUMN IF NOT EXISTS "extra_fields" jsonb`);
    await queryRunner.query(`ALTER TABLE "doppler_data" ADD COLUMN IF NOT EXISTS "extra_fields" jsonb`);
    await queryRunner.query(`ALTER TABLE "biophysical_profiles" ADD COLUMN IF NOT EXISTS "extra_fields" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "biophysical_profiles" DROP COLUMN IF EXISTS "extra_fields"`);
    await queryRunner.query(`ALTER TABLE "doppler_data" DROP COLUMN IF EXISTS "extra_fields"`);
    await queryRunner.query(`ALTER TABLE "fetal_biometries" DROP COLUMN IF EXISTS "extra_fields"`);
    await queryRunner.query(`ALTER TABLE "ultrasounds" DROP COLUMN IF EXISTS "extra_fields"`);
    await queryRunner.query(`ALTER TABLE "ultrasounds" DROP COLUMN IF EXISTS "template_version"`);
  }
}
