import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInteroperabilityFields1711900035000
  implements MigrationInterface
{
  name = 'AddInteroperabilityFields1711900035000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // CNES code on tenants
    const col = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'cnes_code'`,
    );
    if (col.length === 0) {
      await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN "cnes_code" character varying(7)`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "cnes_code"`);
  }
}
