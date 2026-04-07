import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGynecologyConsultations1711900037000
  implements MigrationInterface
{
  name = 'CreateGynecologyConsultations1711900037000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "gynecology_consultation_type_enum" AS ENUM ('routine','return','urgent','preconception','postpartum','adolescent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "menstrual_volume_enum" AS ENUM ('hypomenorrhea','normal','hypermenorrhea')`,
    );
    await queryRunner.query(
      `CREATE TYPE "dysmenorrhea_grade_enum" AS ENUM ('none','mild','moderate','severe')`,
    );
    await queryRunner.query(
      `CREATE TYPE "smoking_status_enum" AS ENUM ('never','former','current')`,
    );
    await queryRunner.query(
      `CREATE TYPE "physical_activity_level_enum" AS ENUM ('sedentary','light','moderate','vigorous')`,
    );
    await queryRunner.query(
      `CREATE TYPE "endometriosis_stage_enum" AS ENUM ('i','ii','iii','iv')`,
    );
    await queryRunner.query(
      `CREATE TYPE "birads_enum" AS ENUM ('birads_0','birads_1','birads_2','birads_3','birads_4a','birads_4b','birads_4c','birads_5','birads_6')`,
    );

    await queryRunner.query(`
      CREATE TABLE "gynecology_consultations" (
        "id"                                       uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"                                uuid,
        "patient_id"                               uuid NOT NULL,
        "doctor_id"                                uuid,
        "consultation_date"                        date NOT NULL,
        "consultation_type"                        "gynecology_consultation_type_enum" NOT NULL DEFAULT 'routine',

        "chief_complaint"                          character varying,
        "current_illness_history"                  text,
        "last_menstrual_period"                    date,
        "cycle_interval"                           integer,
        "cycle_duration"                           integer,
        "cycle_volume"                             "menstrual_volume_enum",
        "dysmenorrhea"                             "dysmenorrhea_grade_enum",
        "last_pap_smear"                           date,
        "last_pap_smear_result"                    character varying,
        "last_mammography"                         date,
        "last_mammography_result"                  character varying,
        "contraceptive_method"                     character varying,
        "sexually_active"                          boolean,
        "number_of_sexual_partners"                integer,
        "history_of_sti"                           boolean,
        "history_of_sti_details"                   text,
        "smoking_status"                           "smoking_status_enum",
        "smoking_packs_per_year"                   numeric(5,2),
        "alcohol_use"                              boolean,
        "physical_activity"                        "physical_activity_level_enum",

        "previous_gynecologic_surgeries"           text,
        "history_of_endometriosis"                 boolean,
        "endometriosis_stage"                      "endometriosis_stage_enum",
        "history_of_myoma"                         boolean,
        "history_of_ovarian_cyst"                  boolean,
        "history_of_pcos"                          boolean,
        "history_of_hpv"                           boolean,
        "history_of_cervical_dysplasia"            boolean,

        "gravida"                                  integer,
        "para"                                     integer,
        "abortus"                                  integer,
        "cesarean"                                 integer,

        "family_history_breast_cancer"             boolean,
        "family_history_ovarian_cancer"            boolean,
        "family_history_endometrial_cancer"        boolean,
        "family_history_colorectal_cancer"         boolean,
        "family_history_diabetes"                  boolean,
        "family_history_cardiovascular_disease"    boolean,
        "family_history_thrombosis"                boolean,
        "family_history_details"                   text,

        "phq2_score"                               integer,
        "gad2_score"                               integer,
        "mental_health_notes"                      text,

        "weight"                                   numeric(5,2),
        "height"                                   numeric(5,2),
        "bmi"                                      numeric(5,2),
        "waist_circumference"                      numeric(5,2),
        "blood_pressure_systolic"                  integer,
        "blood_pressure_diastolic"                 integer,
        "heart_rate"                               integer,
        "temperature"                              numeric(4,1),
        "thyroid_exam"                             text,
        "lymph_node_exam"                          text,
        "signs_of_hyperandrogenism"                boolean,
        "hyperandrogenism_details"                 text,

        "breast_exam_performed"                    boolean NOT NULL DEFAULT false,
        "breast_exam_normal"                       boolean,
        "breast_exam_findings"                     text,
        "birads_classification"                    "birads_enum",

        "pelvic_exam_performed"                    boolean NOT NULL DEFAULT false,
        "vulvar_exam_normal"                       boolean,
        "vulvar_findings"                          text,
        "speculoscopy_performed"                   boolean,
        "cervix_appearance"                        text,
        "pap_smear_collected"                      boolean,
        "bimanual_exam_normal"                     boolean,
        "uterine_size"                             text,
        "adnexal_findings"                         text,
        "pelvic_floor_assessment"                  text,

        "cancer_screening_performed"               jsonb,

        "diagnosis"                                text,
        "icd10_codes"                              text[],
        "requested_exams"                          jsonb,
        "prescriptions"                            jsonb,
        "referrals"                                text,
        "return_date"                              date,
        "notes"                                    text,
        "internal_notes"                           text,
        "alerts"                                   jsonb,

        "created_at"                               TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                               TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gynecology_consultations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_gynecology_consultations_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_gynecology_consultations_patient_date" ON "gynecology_consultations" ("patient_id", "consultation_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gynecology_consultations_tenant" ON "gynecology_consultations" ("tenant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_gynecology_consultations_tenant"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_gynecology_consultations_patient_date"`,
    );
    await queryRunner.query(`DROP TABLE "gynecology_consultations"`);
    await queryRunner.query(`DROP TYPE "birads_enum"`);
    await queryRunner.query(`DROP TYPE "endometriosis_stage_enum"`);
    await queryRunner.query(`DROP TYPE "physical_activity_level_enum"`);
    await queryRunner.query(`DROP TYPE "smoking_status_enum"`);
    await queryRunner.query(`DROP TYPE "dysmenorrhea_grade_enum"`);
    await queryRunner.query(`DROP TYPE "menstrual_volume_enum"`);
    await queryRunner.query(`DROP TYPE "gynecology_consultation_type_enum"`);
  }
}
