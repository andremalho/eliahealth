import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCervicalState1711900043000 implements MigrationInterface {
  name = 'AddCervicalState1711900043000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "consultations_cervical_state_enum" AS ENUM (
          'nr', 'impervious', 'shortened', 'softened', 'dilated', 'other'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "consultations"
      ADD COLUMN IF NOT EXISTS "cervical_state" "consultations_cervical_state_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "cervical_state"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "consultations_cervical_state_enum"`);
  }
}
