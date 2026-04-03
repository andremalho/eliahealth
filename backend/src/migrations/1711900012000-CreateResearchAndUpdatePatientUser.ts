import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResearchAndUpdatePatientUser1711900012000 implements MigrationInterface {
  name = 'CreateResearchAndUpdatePatientUser1711900012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar zipCode na patients
    await queryRunner.query(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "zip_code" character varying`);

    // Adicionar researcher no enum de roles
    await queryRunner.query(`ALTER TYPE "user_role_enum" ADD VALUE IF NOT EXISTS 'researcher'`);

    // Enum age_group
    await queryRunner.query(`CREATE TYPE "age_group_enum" AS ENUM ('15-19','20-24','25-29','30-34','35-39','40+')`);

    // Tabela research_records
    await queryRunner.query(`
      CREATE TABLE "research_records" (
        "id"                        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "research_id"               character varying NOT NULL,
        "pregnancy_id"              uuid NOT NULL,
        "maternal_age"              integer NOT NULL,
        "age_group"                 "age_group_enum" NOT NULL,
        "zip_code_partial"          character varying,
        "region"                    character varying,
        "state"                     character varying,
        "blood_type"                character varying,
        "gravida"                   integer NOT NULL,
        "para"                      integer NOT NULL,
        "abortus"                   integer NOT NULL,
        "plurality"                 integer NOT NULL,
        "chorionicity"              character varying,
        "ga_at_delivery"            integer,
        "delivery_type"             character varying,
        "high_risk_flags"           jsonb NOT NULL DEFAULT '[]',
        "bmi"                       numeric(5,2),
        "gestational_diabetes"      boolean NOT NULL DEFAULT false,
        "hypertension"              boolean NOT NULL DEFAULT false,
        "preeclampsia"              boolean NOT NULL DEFAULT false,
        "hellp_syndrome"            boolean NOT NULL DEFAULT false,
        "fgr"                       boolean NOT NULL DEFAULT false,
        "preterm_birth"             boolean NOT NULL DEFAULT false,
        "trisomy_screening_result"  jsonb,
        "pe_screening_result"       jsonb,
        "neonatal_data"             jsonb,
        "lab_abnormalities"         jsonb,
        "consent_for_research"      boolean NOT NULL DEFAULT false,
        "data_version"              character varying NOT NULL DEFAULT '1.0',
        "created_at"                TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_research_records" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_research_records_research_id" UNIQUE ("research_id"),
        CONSTRAINT "FK_research_records_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_research_records_region" ON "research_records" ("region")`);
    await queryRunner.query(`CREATE INDEX "IDX_research_records_age_group" ON "research_records" ("age_group")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "research_records"`);
    await queryRunner.query(`DROP TYPE "age_group_enum"`);
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN IF EXISTS "zip_code"`);
  }
}
