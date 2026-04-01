import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGeneticCounselings1711900008000 implements MigrationInterface {
  name = 'CreateGeneticCounselings1711900008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "nipt_result_enum" AS ENUM ('low_risk', 'high_risk', 'inconclusive')`);
    await queryRunner.query(`CREATE TYPE "karyotype_method_enum" AS ENUM ('amniocentesis', 'cvs', 'cordocentesis')`);
    await queryRunner.query(`CREATE TYPE "karyotype_classification_enum" AS ENUM ('normal', 'abnormal', 'variant', 'inconclusive')`);
    await queryRunner.query(`CREATE TYPE "genomic_result_enum" AS ENUM ('normal', 'pathogenic', 'likely_pathogenic', 'vus', 'benign')`);
    await queryRunner.query(`CREATE TYPE "exome_type_enum" AS ENUM ('trio', 'proband_only', 'duo')`);

    await queryRunner.query(`
      CREATE TABLE "genetic_counselings" (
        "id"                        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"              uuid NOT NULL,
        "ultrasound_summary_id"     uuid,
        "counseling_date"           date NOT NULL,
        "indication_reason"         text NOT NULL,
        "geneticist_name"           character varying,

        "nipt_date"                 date,
        "nipt_lab"                  character varying,
        "nipt_t21_risk"             character varying,
        "nipt_t21_result"           "nipt_result_enum",
        "nipt_t18_result"           "nipt_result_enum",
        "nipt_t13_result"           "nipt_result_enum",
        "nipt_sex_chromosomes"      character varying,
        "nipt_microdeletions"       jsonb,
        "nipt_raw_report"           text,

        "karyotype_date"            date,
        "karyotype_lab"             character varying,
        "karyotype_method"          "karyotype_method_enum",
        "karyotype_result"          character varying,
        "karyotype_classification"  "karyotype_classification_enum",
        "karyotype_findings"        text,

        "microarray_date"           date,
        "microarray_lab"            character varying,
        "microarray_platform"       character varying,
        "microarray_result"         "genomic_result_enum",
        "microarray_findings"       text,
        "microarray_raw_report"     text,

        "exome_date"                date,
        "exome_lab"                 character varying,
        "exome_type"                "exome_type_enum",
        "exome_result"              "genomic_result_enum",
        "exome_gene"                character varying,
        "exome_variant"             character varying,
        "exome_findings"            text,
        "exome_raw_report"          text,

        "overall_conclusion"        text,
        "recommended_actions"       jsonb,
        "follow_up_date"            date,
        "attachment_urls"           jsonb,
        "ai_interpretation"         text,

        "created_at"                TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_genetic_counselings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_genetic_counselings_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_genetic_counselings_us_summary" FOREIGN KEY ("ultrasound_summary_id")
          REFERENCES "ultrasound_summaries"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_genetic_counselings_pregnancy_id" ON "genetic_counselings" ("pregnancy_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "genetic_counselings"`);
    await queryRunner.query(`DROP TYPE "exome_type_enum"`);
    await queryRunner.query(`DROP TYPE "genomic_result_enum"`);
    await queryRunner.query(`DROP TYPE "karyotype_classification_enum"`);
    await queryRunner.query(`DROP TYPE "karyotype_method_enum"`);
    await queryRunner.query(`DROP TYPE "nipt_result_enum"`);
  }
}
