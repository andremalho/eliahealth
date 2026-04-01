import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLabResultsAndDocuments1711900003000 implements MigrationInterface {
  name = 'CreateLabResultsAndDocuments1711900003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "exam_category_enum" AS ENUM (
        'hematology', 'biochemistry', 'serology_infectious', 'serology_torch',
        'thrombophilia', 'urine', 'microbiology', 'hormones', 'vitamins',
        'hepatitis', 'sexually_transmitted', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "lab_result_status_enum" AS ENUM ('pending', 'normal', 'attention', 'critical')
    `);

    await queryRunner.query(`
      CREATE TYPE "attachment_type_enum" AS ENUM ('pdf', 'image', 'lab_integration')
    `);

    await queryRunner.query(`
      CREATE TYPE "document_type_enum" AS ENUM ('reference_range', 'clinical_guideline', 'patient_result', 'other')
    `);

    await queryRunner.query(`
      CREATE TYPE "file_type_enum" AS ENUM ('pdf', 'image')
    `);

    await queryRunner.query(`
      CREATE TABLE "lab_results" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"        uuid NOT NULL,
        "consultation_id"     uuid,
        "exam_name"           character varying NOT NULL,
        "exam_category"       "exam_category_enum" NOT NULL,
        "exam_subcategory"    character varying,
        "requested_at"        date NOT NULL,
        "result_date"         date,
        "value"               character varying,
        "unit"                character varying,
        "reference_min"       numeric(10,4),
        "reference_max"       numeric(10,4),
        "reference_text"      character varying,
        "result_text"         character varying,
        "status"              "lab_result_status_enum" NOT NULL DEFAULT 'pending',
        "alert_triggered"     boolean NOT NULL DEFAULT false,
        "alert_message"       character varying,
        "notes"               text,
        "ai_interpretation"   text,
        "attachment_url"      character varying,
        "attachment_type"     "attachment_type_enum",
        "lab_integration_id"  character varying,
        "lab_name"            character varying,
        "created_at"          TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lab_results" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lab_results_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_lab_results_consultation" FOREIGN KEY ("consultation_id")
          REFERENCES "consultations"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_lab_results_pregnancy_id" ON "lab_results" ("pregnancy_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_lab_results_category" ON "lab_results" ("exam_category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_lab_results_status" ON "lab_results" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_lab_results_alert" ON "lab_results" ("alert_triggered") WHERE "alert_triggered" = true
    `);

    await queryRunner.query(`
      CREATE TABLE "lab_documents" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"    uuid,
        "title"           character varying NOT NULL,
        "document_type"   "document_type_enum" NOT NULL,
        "category"        character varying NOT NULL,
        "file_url"        character varying NOT NULL,
        "file_type"       "file_type_enum" NOT NULL,
        "extracted_text"  text,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lab_documents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lab_documents_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_lab_documents_pregnancy_id" ON "lab_documents" ("pregnancy_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "lab_documents"`);
    await queryRunner.query(`DROP TABLE "lab_results"`);
    await queryRunner.query(`DROP TYPE "file_type_enum"`);
    await queryRunner.query(`DROP TYPE "document_type_enum"`);
    await queryRunner.query(`DROP TYPE "attachment_type_enum"`);
    await queryRunner.query(`DROP TYPE "lab_result_status_enum"`);
    await queryRunner.query(`DROP TYPE "exam_category_enum"`);
  }
}
