import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInfertilityWorkups1711900040000
  implements MigrationInterface
{
  name = 'CreateInfertilityWorkups1711900040000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "infertility_definition_enum" AS ENUM ('primary','secondary')`,
    );
    await queryRunner.query(
      `CREATE TYPE "ovulatory_status_enum" AS ENUM ('ovulatory','oligoovulatory','anovulatory')`,
    );
    await queryRunner.query(
      `CREATE TYPE "who_ovulation_group_enum" AS ENUM ('group_i','group_ii','group_iii','group_iv')`,
    );
    await queryRunner.query(`
      CREATE TYPE "infertility_diagnosis_enum" AS ENUM (
        'ovulatory_factor','tubal_factor','uterine_factor','male_factor',
        'endometriosis','diminished_ovarian_reserve',
        'premature_ovarian_insufficiency','unexplained','multiple_factors'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "fertility_preservation_indication_enum" AS ENUM (
        'oncofertility','diminished_reserve','advanced_age',
        'autoimmune_disease','social_elective','other'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "infertility_treatment_enum" AS ENUM (
        'expectant_management','ovulation_induction','ovulation_induction_iui',
        'iui_alone','ivf','icsi','donor_eggs','donor_sperm','donor_embryo',
        'surrogacy','adoption_counseling','surgery_first'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "infertility_workups" (
        "id"                                 uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"                          uuid,
        "patient_id"                         uuid NOT NULL,
        "partner_id"                         uuid,
        "doctor_id"                          uuid,
        "workup_date"                        date NOT NULL,

        "infertility_definition"             "infertility_definition_enum" NOT NULL,
        "duration_months"                    integer NOT NULL,
        "age_at_presentation"                integer NOT NULL,
        "expedited_evaluation"               boolean NOT NULL DEFAULT false,
        "immediate_evaluation"               boolean NOT NULL DEFAULT false,

        "ovulatory_factor"                   boolean,
        "ovulatory_status"                   "ovulatory_status_enum",
        "who_group_ovulation"                "who_ovulation_group_enum",

        "ovarian_reserve"                    jsonb,

        "tubal_factor"                       boolean,
        "hsg"                                jsonb,
        "hycosy"                             jsonb,
        "diagnostic_hysteroscopy"            jsonb,
        "pelvic_mri"                         jsonb,
        "laparoscopy_diagnostic"             jsonb,
        "mullerian_anomaly"                  boolean NOT NULL DEFAULT false,
        "mullerian_anomaly_type"             text,

        "male_factor"                        boolean,
        "semen_analysis"                     jsonb,
        "dna_fragmentation"                  jsonb,
        "male_fertility_specialist_referral" boolean NOT NULL DEFAULT false,

        "primary_diagnosis"                  "infertility_diagnosis_enum",
        "secondary_diagnoses"                text[],

        "fertility_preservation"             boolean NOT NULL DEFAULT false,
        "preservation_indication"            "fertility_preservation_indication_enum",
        "preservation_method"                text,
        "preservation_date"                  date,
        "preservation_details"               text,

        "treatment_plan"                     "infertility_treatment_enum",
        "referral_to_art"                    boolean NOT NULL DEFAULT false,
        "art_clinic_name"                    text,
        "notes"                              text,
        "return_date"                        date,
        "alerts"                             jsonb,

        "created_at"                         TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_infertility_workups" PRIMARY KEY ("id"),
        CONSTRAINT "FK_infertility_workups_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_infertility_workups_partner" FOREIGN KEY ("partner_id")
          REFERENCES "patients"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_infertility_workups_patient_date" ON "infertility_workups" ("patient_id", "workup_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_infertility_workups_tenant" ON "infertility_workups" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_infertility_workups_partner" ON "infertility_workups" ("partner_id") WHERE "partner_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_infertility_workups_partner"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_infertility_workups_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_infertility_workups_patient_date"`);
    await queryRunner.query(`DROP TABLE "infertility_workups"`);
    await queryRunner.query(`DROP TYPE "infertility_treatment_enum"`);
    await queryRunner.query(`DROP TYPE "fertility_preservation_indication_enum"`);
    await queryRunner.query(`DROP TYPE "infertility_diagnosis_enum"`);
    await queryRunner.query(`DROP TYPE "who_ovulation_group_enum"`);
    await queryRunner.query(`DROP TYPE "ovulatory_status_enum"`);
    await queryRunner.query(`DROP TYPE "infertility_definition_enum"`);
  }
}
