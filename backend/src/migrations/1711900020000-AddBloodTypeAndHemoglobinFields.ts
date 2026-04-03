import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBloodTypeAndHemoglobinFields1711900020000
  implements MigrationInterface
{
  name = 'AddBloodTypeAndHemoglobinFields1711900020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "blood_type_abo_enum" AS ENUM ('A', 'B', 'AB', 'O')
    `);

    await queryRunner.query(`
      CREATE TYPE "blood_type_rh_enum" AS ENUM ('positive', 'negative')
    `);

    await queryRunner.query(`
      CREATE TYPE "hemoglobin_electrophoresis_enum" AS ENUM (
        'AA', 'AS', 'AC', 'SS', 'SC', 'CC', 'AD', 'AE', 'not_performed'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "patients"
        ADD COLUMN "blood_type_abo" "blood_type_abo_enum",
        ADD COLUMN "blood_type_rh" "blood_type_rh_enum",
        ADD COLUMN "hemoglobin_electrophoresis" "hemoglobin_electrophoresis_enum",
        ADD COLUMN "profile_notes" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
        DROP COLUMN "profile_notes",
        DROP COLUMN "hemoglobin_electrophoresis",
        DROP COLUMN "blood_type_rh",
        DROP COLUMN "blood_type_abo"
    `);

    await queryRunner.query(`DROP TYPE "hemoglobin_electrophoresis_enum"`);
    await queryRunner.query(`DROP TYPE "blood_type_rh_enum"`);
    await queryRunner.query(`DROP TYPE "blood_type_abo_enum"`);
  }
}
