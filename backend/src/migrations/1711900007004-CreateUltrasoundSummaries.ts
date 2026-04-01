import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUltrasoundSummaries1711900007004 implements MigrationInterface {
  name = 'CreateUltrasoundSummaries1711900007004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "summary_exam_type_enum" AS ENUM (
        'obstetric_initial_tv', 'morphological_1st', 'morphological_2nd',
        'echodoppler', 'obstetric_doppler', 'biophysical_profile', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "summary_attachment_type_enum" AS ENUM ('pdf', 'image')
    `);

    await queryRunner.query(`
      CREATE TYPE "summary_report_status_enum" AS ENUM ('uploaded', 'summarized', 'reviewed')
    `);

    await queryRunner.query(`
      CREATE TABLE "ultrasound_summaries" (
        "id"                      uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"            uuid NOT NULL,
        "exam_type"               "summary_exam_type_enum" NOT NULL,
        "exam_date"               date NOT NULL,
        "gestational_age_days"    integer NOT NULL,
        "performed_by"            character varying,
        "facility_name"           character varying,
        "fetal_weight_grams"      integer,
        "fetal_weight_percentile" numeric(5,2),
        "attachment_url"          character varying,
        "attachment_type"         "summary_attachment_type_enum",
        "general_observations"    text,
        "alert_triggered"         boolean NOT NULL DEFAULT false,
        "alert_message"           character varying,
        "ai_extracted_data"       jsonb,
        "specific_findings"       jsonb,
        "report_status"           "summary_report_status_enum" NOT NULL DEFAULT 'uploaded',
        "created_at"              TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ultrasound_summaries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ultrasound_summaries_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ultrasound_summaries_pregnancy_id" ON "ultrasound_summaries" ("pregnancy_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ultrasound_summaries_exam_type" ON "ultrasound_summaries" ("exam_type")
    `);

    // Vincular Ultrasound (camada 2) ao UltrasoundSummary (camada 1)
    await queryRunner.query(`
      ALTER TABLE "ultrasounds" ADD COLUMN IF NOT EXISTS "summary_id" uuid
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_ultrasounds_summary'
        ) THEN
          ALTER TABLE "ultrasounds"
          ADD CONSTRAINT "FK_ultrasounds_summary"
          FOREIGN KEY ("summary_id") REFERENCES "ultrasound_summaries"("id") ON DELETE SET NULL;
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ultrasounds" DROP CONSTRAINT IF EXISTS "FK_ultrasounds_summary"`);
    await queryRunner.query(`ALTER TABLE "ultrasounds" DROP COLUMN IF EXISTS "summary_id"`);
    await queryRunner.query(`DROP TABLE "ultrasound_summaries"`);
    await queryRunner.query(`DROP TYPE "summary_report_status_enum"`);
    await queryRunner.query(`DROP TYPE "summary_attachment_type_enum"`);
    await queryRunner.query(`DROP TYPE "summary_exam_type_enum"`);
  }
}
