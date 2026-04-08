import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGynecologicalFields1711900045000 implements MigrationInterface {
  name = 'AddGynecologicalFields1711900045000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
      ADD COLUMN IF NOT EXISTS "menarche_age" int,
      ADD COLUMN IF NOT EXISTS "menstrual_cycle" varchar(20),
      ADD COLUMN IF NOT EXISTS "dysmenorrhea" boolean
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
      DROP COLUMN IF EXISTS "menarche_age",
      DROP COLUMN IF EXISTS "menstrual_cycle",
      DROP COLUMN IF EXISTS "dysmenorrhea"
    `);
  }
}
