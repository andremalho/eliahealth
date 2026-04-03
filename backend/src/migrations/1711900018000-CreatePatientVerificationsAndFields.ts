import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatientVerificationsAndFields1711900018000
  implements MigrationInterface
{
  name = 'CreatePatientVerificationsAndFields1711900018000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Patient verification table
    await queryRunner.query(`
      CREATE TABLE "patient_verifications" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id"        uuid NOT NULL,
        "token"             character varying NOT NULL,
        "token_expires_at"  TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_used"           boolean NOT NULL DEFAULT false,
        "used_at"           TIMESTAMP WITH TIME ZONE,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patient_verifications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_patient_verifications_token" UNIQUE ("token"),
        CONSTRAINT "FK_patient_verifications_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_patient_verifications_patient_id"
        ON "patient_verifications" ("patient_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_patient_verifications_token"
        ON "patient_verifications" ("token")
    `);

    // New columns on patients
    await queryRunner.query(`
      ALTER TABLE "patients"
        ADD COLUMN "profile_completed_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "verification_email_sent_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "zip_code_partial" character varying(5),
        ADD COLUMN "cpf_hash" character varying
    `);

    // Index on CPF for lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_patients_cpf" ON "patients" ("cpf")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_patients_cpf"`);

    await queryRunner.query(`
      ALTER TABLE "patients"
        DROP COLUMN "cpf_hash",
        DROP COLUMN "zip_code_partial",
        DROP COLUMN "verification_email_sent_at",
        DROP COLUMN "profile_completed_at"
    `);

    await queryRunner.query(`DROP TABLE "patient_verifications"`);
  }
}
