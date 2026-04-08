import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGynecologyHabitFields1711900045000
  implements MigrationInterface
{
  name = 'AddGynecologyHabitFields1711900045000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "alcohol_use_pattern_enum" AS ENUM ('none','social','frequent','abuse')`,
    );

    await queryRunner.query(`
      ALTER TABLE "gynecology_consultations"
        ADD COLUMN "alcohol_use_pattern" "alcohol_use_pattern_enum",
        ADD COLUMN "drug_use" boolean,
        ADD COLUMN "drug_use_details" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "gynecology_consultations"
        DROP COLUMN "drug_use_details",
        DROP COLUMN "drug_use",
        DROP COLUMN "alcohol_use_pattern"
    `);
    await queryRunner.query(`DROP TYPE "alcohol_use_pattern_enum"`);
  }
}
