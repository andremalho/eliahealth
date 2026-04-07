import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssistedReproductionTables1711900041000
  implements MigrationInterface
{
  name = 'CreateAssistedReproductionTables1711900041000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums compartilhados ──
    await queryRunner.query(
      `CREATE TYPE "art_trigger_type_enum" AS ENUM ('hcg_urinary','hcg_recombinant','gnrh_agonist','none')`,
    );
    await queryRunner.query(
      `CREATE TYPE "art_ohss_grade_enum" AS ENUM ('mild','moderate','severe','critical')`,
    );
    await queryRunner.query(
      `CREATE TYPE "art_technical_difficulty_enum" AS ENUM ('easy','moderate','difficult')`,
    );

    // ── Enums OI ──
    await queryRunner.query(`
      CREATE TYPE "oi_indication_enum" AS ENUM (
        'anovulation_who_i','anovulation_who_ii',
        'unexplained_infertility','iui_adjuvant','mild_male_factor'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "oi_protocol_enum" AS ENUM (
        'clomiphene_citrate','letrozole','fsh_recombinant','combined_cc_fsh','hmg'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "oi_cycle_outcome_enum" AS ENUM (
        'ovulated_scheduled_intercourse','ovulated_with_iui',
        'cancelled_ohss_risk','cancelled_poor_response','cancelled_cyst','no_response'
      )
    `);

    // ── Enums IUI ──
    await queryRunner.query(`
      CREATE TYPE "iui_indication_enum" AS ENUM (
        'cervical_factor','mild_male_factor','oi_adjuvant',
        'unexplained','donor_sperm','single_woman'
      )
    `);
    await queryRunner.query(
      `CREATE TYPE "sperm_prep_enum" AS ENUM ('density_gradient','swim_up','direct_wash')`,
    );
    await queryRunner.query(
      `CREATE TYPE "sperm_source_enum" AS ENUM ('partner','donor')`,
    );

    // ── Enums IVF ──
    await queryRunner.query(
      `CREATE TYPE "ivf_cycle_type_enum" AS ENUM ('ivf','icsi','icsi_freeze_all','fet')`,
    );
    await queryRunner.query(`
      CREATE TYPE "stimulation_protocol_enum" AS ENUM (
        'antagonist','long_agonist','short_agonist',
        'natural_cycle','minimal_stimulation'
      )
    `);
    await queryRunner.query(
      `CREATE TYPE "fertilization_method_enum" AS ENUM ('ivf_conventional','icsi')`,
    );
    await queryRunner.query(
      `CREATE TYPE "pgt_type_enum" AS ENUM ('pgt_a','pgt_m','pgt_sr')`,
    );
    await queryRunner.query(
      `CREATE TYPE "transfer_type_enum" AS ENUM ('fresh','frozen_thawed')`,
    );

    // ── Tabela: ovulation_induction_cycles ──
    await queryRunner.query(`
      CREATE TABLE "ovulation_induction_cycles" (
        "id"                                 uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"                          uuid,
        "patient_id"                         uuid NOT NULL,
        "doctor_id"                          uuid,
        "cycle_number"                       integer NOT NULL,
        "cycle_start_date"                   date NOT NULL,
        "indication"                         "oi_indication_enum" NOT NULL,
        "protocol"                           "oi_protocol_enum" NOT NULL,
        "starting_dose"                      numeric(7,2) NOT NULL,
        "starting_dose_unit"                 character varying NOT NULL,
        "trigger_type"                       "art_trigger_type_enum",
        "trigger_dose"                       numeric(7,2),
        "trigger_date"                       date,
        "trigger_time"                       character varying,
        "monitoring_visits"                  jsonb,
        "outcome_type"                       "oi_cycle_outcome_enum",
        "follicles_at_trigger"               integer,
        "endometrial_thickness_at_trigger"   numeric(4,1),
        "estradiol_at_trigger"               numeric(7,1),
        "ovarian_hyperstimulation_syndrome"  boolean NOT NULL DEFAULT false,
        "ohss_grade"                         "art_ohss_grade_enum",
        "cancellation_reason"                text,
        "pregnancy_test"                     boolean,
        "pregnancy_test_date"                date,
        "beta_hcg_value"                     numeric(10,2),
        "clinical_pregnancy"                 boolean,
        "notes"                              text,
        "alerts"                             jsonb,
        "created_at"                         TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ovulation_induction_cycles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_oi_cycles_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_oi_cycles_patient_date" ON "ovulation_induction_cycles" ("patient_id", "cycle_start_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oi_cycles_tenant" ON "ovulation_induction_cycles" ("tenant_id")`,
    );

    // ── Tabela: iui_cycles ──
    await queryRunner.query(`
      CREATE TABLE "iui_cycles" (
        "id"                              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"                       uuid,
        "patient_id"                      uuid NOT NULL,
        "partner_id"                      uuid,
        "doctor_id"                       uuid,
        "cycle_number"                    integer NOT NULL,
        "iui_date"                        date NOT NULL,
        "indication"                      "iui_indication_enum" NOT NULL,
        "sperm_preparation_method"        "sperm_prep_enum" NOT NULL,
        "sperm_source"                    "sperm_source_enum" NOT NULL,
        "donor_id"                        character varying,
        "post_wash_concentration"         numeric(7,2),
        "post_wash_total_motile"          numeric(7,2),
        "post_wash_progressive_motility"  numeric(5,2),
        "catheter_type"                   character varying,
        "technical_difficulty"            "art_technical_difficulty_enum",
        "oi_cycle_id"                     uuid,
        "luteral_support"                 boolean NOT NULL DEFAULT false,
        "luteral_support_protocol"        text,
        "pregnancy_test_date"             date,
        "beta_hcg_value"                  numeric(10,2),
        "clinical_pregnancy"              boolean,
        "notes"                           text,
        "alerts"                          jsonb,
        "created_at"                      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_iui_cycles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_iui_cycles_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_iui_cycles_partner" FOREIGN KEY ("partner_id")
          REFERENCES "patients"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_iui_cycles_oi" FOREIGN KEY ("oi_cycle_id")
          REFERENCES "ovulation_induction_cycles"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_iui_cycles_patient_date" ON "iui_cycles" ("patient_id", "iui_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_iui_cycles_tenant" ON "iui_cycles" ("tenant_id")`,
    );

    // ── Tabela: ivf_cycles ──
    await queryRunner.query(`
      CREATE TABLE "ivf_cycles" (
        "id"                                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"                           uuid,
        "patient_id"                          uuid NOT NULL,
        "partner_id"                          uuid,
        "doctor_id"                           uuid,
        "cycle_number"                        integer NOT NULL,
        "cycle_type"                          "ivf_cycle_type_enum" NOT NULL,
        "stimulation_protocol"                "stimulation_protocol_enum" NOT NULL,
        "stimulation_start_date"              date,

        "total_fsh_dose"                      numeric(8,2),
        "stimulation_days"                    integer,
        "peak_estradiol"                      numeric(8,1),
        "trigger_type"                        "art_trigger_type_enum",
        "trigger_date"                        date,

        "oocyte_retrieval_date"               date,
        "total_oocytes_retrieved"             integer,
        "mii_oocytes"                         integer,
        "mi_oocytes"                          integer,
        "gv_oocytes"                          integer,
        "atretic"                             integer,

        "fertilization_method"                "fertilization_method_enum" NOT NULL,
        "fertilized_2pn"                      integer,
        "fertilization_rate"                  numeric(5,2),

        "day3_embryos"                        integer,
        "blastocysts"                         integer,
        "blasto_grades"                       text[],

        "pgt_performed"                       boolean NOT NULL DEFAULT false,
        "pgt_type"                            "pgt_type_enum",
        "euploid_embryos"                     integer,

        "cryopreserved_embryos"               integer,
        "cryopreservation_date"               date,

        "transfer_date"                       date,
        "embryos_transferred"                 integer,
        "embryo_grades_transferred"           text[],
        "transfer_type"                       "transfer_type_enum",
        "endometrial_thickness_at_transfer"   numeric(4,1),
        "luteal_support_protocol"             text,
        "technical_difficulty"                "art_technical_difficulty_enum",

        "ovarian_hyperstimulation_syndrome"   boolean NOT NULL DEFAULT false,
        "ohss_grade"                          "art_ohss_grade_enum",
        "ohss_hospitalization"                boolean,
        "beta_hcg_date"                       date,
        "beta_hcg_value"                      numeric(10,2),
        "clinical_pregnancy"                  boolean,
        "live_birth"                          boolean,
        "miscarriage"                         boolean,
        "cancelled_reason"                    text,
        "cumulative_embryos_in_storage"       integer,
        "notes"                               text,
        "alerts"                              jsonb,

        "created_at"                          TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ivf_cycles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ivf_cycles_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ivf_cycles_partner" FOREIGN KEY ("partner_id")
          REFERENCES "patients"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ivf_cycles_patient_cycle" ON "ivf_cycles" ("patient_id", "cycle_number" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ivf_cycles_tenant" ON "ivf_cycles" ("tenant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ivf_cycles_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ivf_cycles_patient_cycle"`);
    await queryRunner.query(`DROP TABLE "ivf_cycles"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_iui_cycles_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_iui_cycles_patient_date"`);
    await queryRunner.query(`DROP TABLE "iui_cycles"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oi_cycles_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oi_cycles_patient_date"`);
    await queryRunner.query(`DROP TABLE "ovulation_induction_cycles"`);

    await queryRunner.query(`DROP TYPE "transfer_type_enum"`);
    await queryRunner.query(`DROP TYPE "pgt_type_enum"`);
    await queryRunner.query(`DROP TYPE "fertilization_method_enum"`);
    await queryRunner.query(`DROP TYPE "stimulation_protocol_enum"`);
    await queryRunner.query(`DROP TYPE "ivf_cycle_type_enum"`);
    await queryRunner.query(`DROP TYPE "sperm_source_enum"`);
    await queryRunner.query(`DROP TYPE "sperm_prep_enum"`);
    await queryRunner.query(`DROP TYPE "iui_indication_enum"`);
    await queryRunner.query(`DROP TYPE "oi_cycle_outcome_enum"`);
    await queryRunner.query(`DROP TYPE "oi_protocol_enum"`);
    await queryRunner.query(`DROP TYPE "oi_indication_enum"`);
    await queryRunner.query(`DROP TYPE "art_technical_difficulty_enum"`);
    await queryRunner.query(`DROP TYPE "art_ohss_grade_enum"`);
    await queryRunner.query(`DROP TYPE "art_trigger_type_enum"`);
  }
}
