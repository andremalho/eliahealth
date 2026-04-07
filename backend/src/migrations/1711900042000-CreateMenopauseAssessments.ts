import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMenopauseAssessments1711900042000
  implements MigrationInterface
{
  name = 'CreateMenopauseAssessments1711900042000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "straw_stage_enum" AS ENUM (
        'reproductive_peak',
        'reproductive_late_a','reproductive_late_b',
        'menopausal_transition_early','menopausal_transition_late',
        'postmenopause_early_1a','postmenopause_early_1b','postmenopause_early_1c',
        'postmenopause_late'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "menopause_type_enum" AS ENUM (
        'natural','surgical','chemotherapy_induced',
        'radiation_induced','premature_ovarian_insufficiency'
      )
    `);
    await queryRunner.query(
      `CREATE TYPE "hot_flash_intensity_enum" AS ENUM ('mild','moderate','severe')`,
    );
    await queryRunner.query(`
      CREATE TYPE "osteoporosis_classification_enum" AS ENUM (
        'normal','osteopenia','osteoporosis','severe_osteoporosis'
      )
    `);
    await queryRunner.query(
      `CREATE TYPE "cardio_risk_enum" AS ENUM ('low','intermediate','high')`,
    );
    await queryRunner.query(`
      CREATE TYPE "hrt_scheme_enum" AS ENUM (
        'estrogen_only','combined_sequential','combined_continuous',
        'local_estrogen_only','tibolone','ospemifene','none'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "estrogen_route_enum" AS ENUM (
        'oral','transdermal_patch','transdermal_gel','transdermal_spray',
        'vaginal_cream','vaginal_ring','vaginal_ovule','none'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "menopause_assessments" (
        "id"                              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"                       uuid,
        "patient_id"                      uuid NOT NULL,
        "doctor_id"                       uuid,
        "assessment_date"                 date NOT NULL,

        "straw_stage"                     "straw_stage_enum" NOT NULL,
        "menopause_date"                  date,
        "menopause_type"                  "menopause_type_enum" NOT NULL,
        "age_at_menopause"                integer,

        "mrs_hot_flashes"                 integer,
        "mrs_heart_palpitations"          integer,
        "mrs_sleep_disorders"             integer,
        "mrs_joint_muscle_discomfort"     integer,
        "mrs_depressive_mood"             integer,
        "mrs_irritability"                integer,
        "mrs_anxiety"                     integer,
        "mrs_physical_mental_exhaustion"  integer,
        "mrs_sexual_problems"             integer,
        "mrs_bladder_problems"            integer,
        "mrs_dryness_vagina"              integer,
        "mrs_total_score"                 integer,

        "hot_flashes_per_day"             integer,
        "hot_flashes_per_night"           integer,
        "hot_flash_intensity"             "hot_flash_intensity_enum",

        "gsm_diagnosis"                   boolean NOT NULL DEFAULT false,
        "gsm_vaginal_dryness"             boolean,
        "gsm_dyspareunia"                 boolean,
        "gsm_recurrent_uti"               boolean,
        "gsm_urinary_incontinence"        boolean,
        "gsm_vulvar_atrophy"              boolean,
        "ph_meter_result"                 numeric(3,1),

        "dexa_lumbar_t_score"             numeric(4,2),
        "dexa_femoral_neck_t_score"       numeric(4,2),
        "dexa_total_hip_t_score"          numeric(4,2),
        "dexa_date"                       date,
        "osteoporosis_classification"     "osteoporosis_classification_enum",
        "frax_score_10yr_major"           numeric(5,2),
        "frax_score_10yr_hip"             numeric(5,2),

        "framingham_score"                numeric(5,2),
        "cardio_risk_category"            "cardio_risk_enum",

        "labs"                            jsonb,

        "hrt_indicated"                   boolean NOT NULL DEFAULT false,
        "hrt_contraindicated"             boolean NOT NULL DEFAULT false,
        "hrt_contraindication_reasons"    text[],
        "hrt_scheme"                      "hrt_scheme_enum",
        "estrogen_route"                  "estrogen_route_enum",
        "estrogen_drug"                   text,
        "progestogen_drug"                text,
        "hrt_start_date"                  date,
        "hrt_review_date"                 date,
        "hrt_side_effects"                text,

        "non_hormonal_therapy"            text[],

        "osteoporosis_treatment"          text,
        "calcium_supplementation"         numeric(7,1),
        "vitamin_d_supplementation"       numeric(7,1),
        "vitamin_d_level"                 numeric(5,1),

        "mms_score"                       integer,
        "moca_score"                      integer,
        "cognitive_complaint"             boolean NOT NULL DEFAULT false,
        "cognitive_referral"              boolean,

        "fsfi_score"                      numeric(5,2),
        "sexual_dysfunction"              boolean,
        "sexual_dysfunction_type"         text,

        "diagnosis"                       text,
        "icd10_codes"                     text[],
        "treatment_plan"                  text,
        "next_dexa_date"                  date,
        "next_mammography_date"           date,
        "return_date"                     date,
        "notes"                           text,
        "internal_notes"                  text,
        "alerts"                          jsonb,

        "created_at"                      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menopause_assessments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_menopause_assessments_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_menopause_assessments_patient_date" ON "menopause_assessments" ("patient_id", "assessment_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_menopause_assessments_tenant" ON "menopause_assessments" ("tenant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_menopause_assessments_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_menopause_assessments_patient_date"`);
    await queryRunner.query(`DROP TABLE "menopause_assessments"`);
    await queryRunner.query(`DROP TYPE "estrogen_route_enum"`);
    await queryRunner.query(`DROP TYPE "hrt_scheme_enum"`);
    await queryRunner.query(`DROP TYPE "cardio_risk_enum"`);
    await queryRunner.query(`DROP TYPE "osteoporosis_classification_enum"`);
    await queryRunner.query(`DROP TYPE "hot_flash_intensity_enum"`);
    await queryRunner.query(`DROP TYPE "menopause_type_enum"`);
    await queryRunner.query(`DROP TYPE "straw_stage_enum"`);
  }
}
