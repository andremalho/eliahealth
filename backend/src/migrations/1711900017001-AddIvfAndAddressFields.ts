import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIvfAndAddressFields1711900017001
  implements MigrationInterface
{
  name = 'AddIvfAndAddressFields1711900017001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // IVF transfer type enum
    await queryRunner.query(`
      CREATE TYPE "ivf_transfer_type_enum" AS ENUM (
        'd3', 'd5', 'blastocyst', 'natural_cycle'
      )
    `);

    // IVF columns on pregnancies
    await queryRunner.query(`
      ALTER TABLE "pregnancies"
        ADD COLUMN "ivf_transfer_type" "ivf_transfer_type_enum",
        ADD COLUMN "ivf_transfer_date" date
    `);

    // Address columns on patients
    await queryRunner.query(`
      ALTER TABLE "patients"
        ADD COLUMN "address" character varying,
        ADD COLUMN "city" character varying,
        ADD COLUMN "state" character varying(2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
        DROP COLUMN "state",
        DROP COLUMN "city",
        DROP COLUMN "address"
    `);

    await queryRunner.query(`
      ALTER TABLE "pregnancies"
        DROP COLUMN "ivf_transfer_date",
        DROP COLUMN "ivf_transfer_type"
    `);

    await queryRunner.query(`DROP TYPE "ivf_transfer_type_enum"`);
  }
}
