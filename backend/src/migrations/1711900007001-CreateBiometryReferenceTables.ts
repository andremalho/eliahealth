import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBiometryReferenceTables1711900007001 implements MigrationInterface {
  name = 'CreateBiometryReferenceTables1711900007001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "biometry_parameter_enum" AS ENUM (
        'bpd','hc','ac','fl','efw','crl','nt','cervical_length','mca_psv','umbilical_pi','uterine_pi'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "biometry_reference_tables" (
        "id"                      uuid NOT NULL DEFAULT uuid_generate_v4(),
        "table_name"              character varying NOT NULL,
        "parameter"               "biometry_parameter_enum" NOT NULL,
        "gestational_age_weeks"   integer NOT NULL,
        "p5"                      numeric(10,2),
        "p10"                     numeric(10,2),
        "p25"                     numeric(10,2),
        "p50"                     numeric(10,2) NOT NULL,
        "p75"                     numeric(10,2),
        "p90"                     numeric(10,2),
        "p95"                     numeric(10,2),
        "mean"                    numeric(10,4),
        "sd"                      numeric(10,4),
        "unit"                    character varying NOT NULL,
        "source"                  character varying NOT NULL,
        "is_default"              boolean NOT NULL DEFAULT false,
        "is_active"               boolean NOT NULL DEFAULT true,
        "created_at"              TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_biometry_reference_tables" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_biometry_ref_parameter_ga" ON "biometry_reference_tables" ("parameter", "gestational_age_weeks")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_biometry_ref_default" ON "biometry_reference_tables" ("parameter", "is_default") WHERE "is_default" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "biometry_reference_tables"`);
    await queryRunner.query(`DROP TYPE "biometry_parameter_enum"`);
  }
}
