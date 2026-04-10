import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncomeToResearchRecords1711900055000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "research_records" ADD COLUMN IF NOT EXISTS "income_estimate" varchar`);
    await queryRunner.query(`ALTER TABLE "research_records" ADD COLUMN IF NOT EXISTS "neighborhood" varchar`);
    await queryRunner.query(`ALTER TABLE "research_records" ADD COLUMN IF NOT EXISTS "zone" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "research_records" DROP COLUMN IF EXISTS "zone"`);
    await queryRunner.query(`ALTER TABLE "research_records" DROP COLUMN IF EXISTS "neighborhood"`);
    await queryRunner.query(`ALTER TABLE "research_records" DROP COLUMN IF EXISTS "income_estimate"`);
  }
}
