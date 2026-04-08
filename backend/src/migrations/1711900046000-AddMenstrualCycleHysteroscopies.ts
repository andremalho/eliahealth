import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenstrualCycleHysteroscopies1711900046000
  implements MigrationInterface
{
  name = 'AddMenstrualCycleHysteroscopies1711900046000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "menstrual_cycle_assessments"
      ADD COLUMN "hysteroscopies" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "menstrual_cycle_assessments"
      DROP COLUMN "hysteroscopies"
    `);
  }
}
