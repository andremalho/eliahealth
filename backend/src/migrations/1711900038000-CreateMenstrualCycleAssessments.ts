import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMenstrualCycleAssessments1711900038000
  implements MigrationInterface
{
  name = 'CreateMenstrualCycleAssessments1711900038000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "menstrual_complaint_enum" AS ENUM (
        'heavy_menstrual_bleeding',
        'irregular_bleeding',
        'intermenstrual_bleeding',
        'postcoital_bleeding',
        'amenorrhea_primary',
        'amenorrhea_secondary',
        'dysmenorrhea',
        'premenstrual_syndrome',
        'pmdd'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "leiomyoma_figo_enum" AS ENUM (
        'submucosal_0','submucosal_1','submucosal_2',
        'intramural_3',
        'subserosal_4','subserosal_5','subserosal_6',
        'intraligamentous_7','hybrid_2_5','cervical_8'
      )
    `);

    // Nota: "endometriosis_stage_enum" já existe (criado pela migration 1711900037000-CreateGynecologyConsultations).
    // Reusamos o mesmo tipo postgres aqui — não recriamos.

    await queryRunner.query(`
      CREATE TABLE "menstrual_cycle_assessments" (
        "id"                              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"                       uuid,
        "patient_id"                      uuid NOT NULL,
        "doctor_id"                       uuid,
        "assessment_date"                 date NOT NULL,
        "chief_complaint"                 "menstrual_complaint_enum" NOT NULL,

        "cycle_interval_days"             integer,
        "cycle_duration_days"             integer,
        "last_menstrual_period"           date,
        "estimated_blood_volume_ml"       integer,
        "pictorial_blood_chart"           integer,
        "number_of_pads_per_day"          integer,

        "palm_polyp"                      boolean NOT NULL DEFAULT false,
        "palm_adenomyosis"                boolean NOT NULL DEFAULT false,
        "palm_leiomyoma"                  boolean NOT NULL DEFAULT false,
        "palm_leiomyoma_location"         "leiomyoma_figo_enum",
        "palm_malignancy_or_hyperplasia"  boolean NOT NULL DEFAULT false,
        "palm_malignancy_details"         text,

        "coein_coagulopathy"              boolean NOT NULL DEFAULT false,
        "coein_coagulopathy_type"         character varying,
        "coein_ovulatory_dysfunction"     boolean NOT NULL DEFAULT false,
        "coein_ovulatory_type"            character varying,
        "coein_endometrial"               boolean NOT NULL DEFAULT false,
        "coein_iatrogenic"                boolean NOT NULL DEFAULT false,
        "coein_iatrogenic_details"        character varying,
        "coein_not_yet_classified"        boolean NOT NULL DEFAULT false,

        "pcos_diagnosis"                  boolean NOT NULL DEFAULT false,
        "pcos_rotterdam_criteria"         jsonb,
        "pcos_homa_ir"                    numeric(5,2),
        "pcos_metabolic_risk"             text,

        "endometriosis_diagnosis"         boolean NOT NULL DEFAULT false,
        "endometriosis_stage"             "endometriosis_stage_enum",
        "endometriosis_location"          text[],

        "labs"                            jsonb,
        "transvaginal_ultrasound"         jsonb,
        "pelvic_mri"                      jsonb,

        "diagnosis"                       text,
        "icd10_codes"                     text[],
        "treatment_plan"                  text,
        "medication_prescribed"           jsonb,
        "surgical_referral"               boolean NOT NULL DEFAULT false,
        "surgical_details"                text,
        "hysteroscopy_performed"          boolean NOT NULL DEFAULT false,
        "hysteroscopy_date"               date,
        "hysteroscopy_findings"           text,
        "return_date"                     date,
        "notes"                           text,
        "alerts"                          jsonb,

        "created_at"                      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menstrual_cycle_assessments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_menstrual_cycle_assessments_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_menstrual_cycle_assessments_patient_date" ON "menstrual_cycle_assessments" ("patient_id", "assessment_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_menstrual_cycle_assessments_tenant" ON "menstrual_cycle_assessments" ("tenant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_menstrual_cycle_assessments_tenant"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_menstrual_cycle_assessments_patient_date"`,
    );
    await queryRunner.query(`DROP TABLE "menstrual_cycle_assessments"`);
    await queryRunner.query(`DROP TYPE "leiomyoma_figo_enum"`);
    await queryRunner.query(`DROP TYPE "menstrual_complaint_enum"`);
    // endometriosis_stage_enum NÃO é dropado aqui — ele pertence à migration de gynecology_consultations.
  }
}
