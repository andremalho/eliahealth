import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewedAtToLabResults1711900050000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const col = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_results' AND column_name = 'reviewed_at'`,
    );
    if (col.length === 0) {
      await queryRunner.query(`ALTER TABLE "lab_results" ADD COLUMN "reviewed_at" timestamptz`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lab_results" DROP COLUMN IF EXISTS "reviewed_at"`);
  }
}
