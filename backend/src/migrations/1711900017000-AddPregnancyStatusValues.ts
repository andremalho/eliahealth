import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPregnancyStatusValues1711900017000
  implements MigrationInterface
{
  name = 'AddPregnancyStatusValues1711900017000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the enum type already exists
    const enumExists = await queryRunner.query(`
      SELECT 1 FROM pg_type WHERE typname = 'pregnancy_status_enum'
    `);

    if (enumExists.length === 0) {
      // Enum doesn't exist yet — create with all values
      await queryRunner.query(`
        CREATE TYPE "pregnancy_status_enum" AS ENUM (
          'active', 'completed', 'interrupted', 'pregnancy_loss'
        )
      `);
    } else {
      // Enum exists — add only the new value
      await queryRunner.query(`
        ALTER TYPE "pregnancy_status_enum"
        ADD VALUE IF NOT EXISTS 'pregnancy_loss'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Enum value removal requires recreating the type — intentionally left empty
    // to avoid data loss on rollback.
  }
}
