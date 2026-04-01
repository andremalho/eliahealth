import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCorenToUsers1711900006002 implements MigrationInterface {
  name = 'AddCorenToUsers1711900006002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "coren" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "coren"
    `);
  }
}
