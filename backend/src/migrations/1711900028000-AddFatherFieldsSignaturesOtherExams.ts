import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFatherFieldsSignaturesOtherExams1711900028000
  implements MigrationInterface
{
  name = 'AddFatherFieldsSignaturesOtherExams1711900028000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── BiologicalFather new fields ──
    await queryRunner.query(`
      ALTER TABLE "biological_fathers"
        ADD COLUMN "date_of_birth" date,
        ADD COLUMN "blood_type_abo" "blood_type_abo_enum",
        ADD COLUMN "blood_type_rh" "blood_type_rh_enum",
        ADD COLUMN "ethnicity" character varying,
        ADD COLUMN "occupation" character varying
    `);

    // ── Prescription Memed + digital signature ──
    await queryRunner.query(`
      CREATE TYPE "external_provider_enum" AS ENUM ('memed', 'internal')
    `);
    await queryRunner.query(`
      CREATE TYPE "digital_signature_provider_enum" AS ENUM ('bird_id', 'certisign', 'valid')
    `);

    await queryRunner.query(`
      ALTER TABLE "prescriptions"
        ADD COLUMN "external_prescription_id" character varying,
        ADD COLUMN "external_provider" "external_provider_enum" NOT NULL DEFAULT 'internal',
        ADD COLUMN "digital_signature_id" character varying,
        ADD COLUMN "digital_signature_provider" "digital_signature_provider_enum",
        ADD COLUMN "signed_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "signed_document_url" character varying
    `);

    // ── LabResult digital signature ──
    await queryRunner.query(`
      ALTER TABLE "lab_results"
        ADD COLUMN "digital_signature_id" character varying,
        ADD COLUMN "signed_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "signed_document_url" character varying
    `);

    // ── UltrasoundSummary digital signature ──
    await queryRunner.query(`
      ALTER TABLE "ultrasound_summaries"
        ADD COLUMN "digital_signature_id" character varying,
        ADD COLUMN "signed_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "signed_document_url" character varying
    `);

    // ── OtherExams table ──
    await queryRunner.query(`
      CREATE TABLE "other_exams" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"    uuid NOT NULL,
        "exam_name"       character varying NOT NULL,
        "exam_date"       date NOT NULL,
        "result"          text,
        "is_altered"      boolean NOT NULL DEFAULT false,
        "attachment_url"  character varying,
        "notes"           text,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_other_exams" PRIMARY KEY ("id"),
        CONSTRAINT "FK_other_exams_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_other_exams_pregnancy_id" ON "other_exams" ("pregnancy_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "other_exams"`);

    await queryRunner.query(`
      ALTER TABLE "ultrasound_summaries"
        DROP COLUMN "signed_document_url",
        DROP COLUMN "signed_at",
        DROP COLUMN "digital_signature_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "lab_results"
        DROP COLUMN "signed_document_url",
        DROP COLUMN "signed_at",
        DROP COLUMN "digital_signature_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "prescriptions"
        DROP COLUMN "signed_document_url",
        DROP COLUMN "signed_at",
        DROP COLUMN "digital_signature_provider",
        DROP COLUMN "digital_signature_id",
        DROP COLUMN "external_provider",
        DROP COLUMN "external_prescription_id"
    `);

    await queryRunner.query(`DROP TYPE "digital_signature_provider_enum"`);
    await queryRunner.query(`DROP TYPE "external_provider_enum"`);

    await queryRunner.query(`
      ALTER TABLE "biological_fathers"
        DROP COLUMN "occupation",
        DROP COLUMN "ethnicity",
        DROP COLUMN "blood_type_rh",
        DROP COLUMN "blood_type_abo",
        DROP COLUMN "date_of_birth"
    `);
  }
}
