import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandConsultationFields1711900026000
  implements MigrationInterface
{
  name = 'ExpandConsultationFields1711900026000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // New edema values
    const newEdemaValues = ['absent', '1plus', '2plus', '3plus', '4plus'];
    for (const val of newEdemaValues) {
      await queryRunner.query(
        `ALTER TYPE "edema_grade_enum" ADD VALUE IF NOT EXISTS '${val}'`,
      );
    }

    // Cervical exam enums
    await queryRunner.query(`
      CREATE TYPE "cervical_position_enum" AS ENUM ('posterior', 'medianized', 'anterior')
    `);
    await queryRunner.query(`
      CREATE TYPE "cervical_consistency_enum" AS ENUM ('firm', 'medium', 'soft')
    `);
    await queryRunner.query(`
      CREATE TYPE "fetal_station_enum" AS ENUM ('high', 'intermediate', 'engaged')
    `);
    await queryRunner.query(`
      CREATE TYPE "membranes_enum" AS ENUM ('intact', 'ruptured', 'not_evaluated')
    `);
    await queryRunner.query(`
      CREATE TYPE "fhr_status_enum" AS ENUM (
        'present_normal', 'tachycardia', 'bradycardia', 'arrhythmia', 'absent'
      )
    `);

    // New columns on consultations
    await queryRunner.query(`
      ALTER TABLE "consultations"
        ADD COLUMN "fhr_value" integer,
        ADD COLUMN "fhr_status" "fhr_status_enum",
        ADD COLUMN "cervical_position" "cervical_position_enum",
        ADD COLUMN "cervical_consistency" "cervical_consistency_enum",
        ADD COLUMN "cervical_dilation" decimal(3,1),
        ADD COLUMN "cervical_effacement" integer,
        ADD COLUMN "fetal_station" "fetal_station_enum",
        ADD COLUMN "membranes" "membranes_enum",
        ADD COLUMN "alerts" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "consultations"
        DROP COLUMN "alerts",
        DROP COLUMN "membranes",
        DROP COLUMN "fetal_station",
        DROP COLUMN "cervical_effacement",
        DROP COLUMN "cervical_dilation",
        DROP COLUMN "cervical_consistency",
        DROP COLUMN "cervical_position",
        DROP COLUMN "fhr_status",
        DROP COLUMN "fhr_value"
    `);

    await queryRunner.query(`DROP TYPE "fhr_status_enum"`);
    await queryRunner.query(`DROP TYPE "membranes_enum"`);
    await queryRunner.query(`DROP TYPE "fetal_station_enum"`);
    await queryRunner.query(`DROP TYPE "cervical_consistency_enum"`);
    await queryRunner.query(`DROP TYPE "cervical_position_enum"`);
  }
}
