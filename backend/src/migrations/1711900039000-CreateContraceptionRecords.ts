import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContraceptionRecords1711900039000
  implements MigrationInterface
{
  name = 'CreateContraceptionRecords1711900039000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "contraceptive_method_enum" AS ENUM (
        'none',
        'combined_oral','progestin_only_pill',
        'combined_injectable','progestin_injectable',
        'copper_iud','lng_iud_52mg','lng_iud_19mg',
        'etonogestrel_implant',
        'combined_patch','vaginal_ring',
        'male_condom','female_condom','diaphragm',
        'copper_iud_emergency','levonorgestrel_emergency','ulipristal_emergency',
        'tubal_ligation','vasectomy_partner',
        'natural_family_planning','abstinence','other'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "reproductive_desire_enum" AS ENUM (
        'desires_now',
        'desires_future_less_1year',
        'desires_future_1_3years',
        'desires_future_more_3years',
        'completed_family',
        'undecided'
      )
    `);
    await queryRunner.query(
      `CREATE TYPE "whomec_category_enum" AS ENUM ('cat1','cat2','cat3','cat4')`,
    );

    // smoking_status_enum já existe (criado pela migration de gynecology_consultations)

    await queryRunner.query(`
      CREATE TABLE "contraception_records" (
        "id"                              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"                       uuid,
        "patient_id"                      uuid NOT NULL,
        "doctor_id"                       uuid,
        "consultation_date"               date NOT NULL,

        "current_method"                  "contraceptive_method_enum" NOT NULL DEFAULT 'none',
        "current_method_start_date"       date,
        "current_method_details"          text,

        "previous_methods"                jsonb,

        "desire_for_pregnancy"            "reproductive_desire_enum" NOT NULL,
        "breastfeeding"                   boolean NOT NULL DEFAULT false,

        "whomec_category"                 "whomec_category_enum",
        "whomec_conditions"               jsonb,
        "contraindications"               text[],

        "smoking_status"                  "smoking_status_enum",
        "smoking_age_35_plus"             boolean NOT NULL DEFAULT false,
        "history_of_vte"                  boolean NOT NULL DEFAULT false,
        "thrombophilia"                   boolean NOT NULL DEFAULT false,
        "thrombophilia_details"           text,
        "migraine_with_aura"              boolean NOT NULL DEFAULT false,
        "uncontrolled_hypertension"       boolean NOT NULL DEFAULT false,
        "diabetes_with_15years_plus"      boolean NOT NULL DEFAULT false,
        "breast_cancer_history"           boolean NOT NULL DEFAULT false,
        "liver_disease"                   boolean NOT NULL DEFAULT false,
        "cardiovascular_disease"          boolean NOT NULL DEFAULT false,
        "stroke"                          boolean NOT NULL DEFAULT false,

        "iud_insertion_date"              date,
        "iud_expiration_date"             date,
        "iud_position_ultrasound"         text,
        "iud_next_check_date"             date,
        "iud_removal_date"                date,
        "iud_removal_reason"              text,

        "implant_insertion_date"          date,
        "implant_expiration_date"         date,
        "implant_location"                text,
        "implant_removal_date"            date,

        "emergency_contraception_used"    boolean NOT NULL DEFAULT false,
        "emergency_contraception_date"    date,
        "emergency_contraception_method"  character varying,
        "emergency_contraception_reason"  text,

        "method_prescribed"               "contraceptive_method_enum",
        "method_prescribed_details"       text,
        "counseling_provided"             boolean NOT NULL DEFAULT false,
        "counseling_topics"               text[],
        "return_date"                     date,
        "notes"                           text,
        "alerts"                          jsonb,

        "created_at"                      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contraception_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_contraception_records_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_contraception_records_patient_date" ON "contraception_records" ("patient_id", "consultation_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contraception_records_tenant" ON "contraception_records" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contraception_records_iud_expiry" ON "contraception_records" ("iud_expiration_date") WHERE "iud_expiration_date" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contraception_records_implant_expiry" ON "contraception_records" ("implant_expiration_date") WHERE "implant_expiration_date" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_contraception_records_implant_expiry"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_contraception_records_iud_expiry"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_contraception_records_tenant"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_contraception_records_patient_date"`,
    );
    await queryRunner.query(`DROP TABLE "contraception_records"`);
    await queryRunner.query(`DROP TYPE "whomec_category_enum"`);
    await queryRunner.query(`DROP TYPE "reproductive_desire_enum"`);
    await queryRunner.query(`DROP TYPE "contraceptive_method_enum"`);
    // smoking_status_enum NÃO é dropado — pertence à migration de gynecology_consultations
  }
}
