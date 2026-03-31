import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatients1711900000000 implements MigrationInterface {
  name = 'CreatePatients1711900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "full_name"        character varying NOT NULL,
        "cpf"              character varying NOT NULL,
        "date_of_birth"    date,
        "phone"            character varying,
        "email"            character varying,
        "blood_type"       character varying,
        "lgpd_consent_at"  TIMESTAMP WITH TIME ZONE,
        "created_at"       TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patients" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_patients_cpf" UNIQUE ("cpf"),
        CONSTRAINT "UQ_patients_email" UNIQUE ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "patients"`);
  }
}
