import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFetalPresentationValues1711900033000
  implements MigrationInterface
{
  name = 'AddFetalPresentationValues1711900033000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "fetal_presentation_enum" ADD VALUE IF NOT EXISTS 'nr'`,
    );
    await queryRunner.query(
      `ALTER TYPE "fetal_presentation_enum" ADD VALUE IF NOT EXISTS 'oblique'`,
    );

    // Set default for new consultations
    await queryRunner.query(`COMMIT`);
    await queryRunner.query(`BEGIN`);

    await queryRunner.query(`
      ALTER TABLE "consultations"
        ALTER COLUMN "fetal_presentation" SET DEFAULT 'nr'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "consultations"
        ALTER COLUMN "fetal_presentation" DROP DEFAULT
    `);
  }
}
