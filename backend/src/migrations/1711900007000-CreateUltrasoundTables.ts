import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUltrasoundTables1711900007000 implements MigrationInterface {
  name = 'CreateUltrasoundTables1711900007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ──
    await queryRunner.query(`CREATE TYPE "us_exam_type_enum" AS ENUM ('obstetric_initial_tv','morphological_1st','morphological_2nd','echodoppler','obstetric_doppler','biophysical_profile','other')`);
    await queryRunner.query(`CREATE TYPE "image_quality_enum" AS ENUM ('good','regular','poor')`);
    await queryRunner.query(`CREATE TYPE "report_status_enum" AS ENUM ('draft','preliminary','final')`);
    await queryRunner.query(`CREATE TYPE "nasal_bone_enum" AS ENUM ('present','absent','not_evaluated')`);
    await queryRunner.query(`CREATE TYPE "placenta_grade_enum" AS ENUM ('0','I','II','III')`);
    await queryRunner.query(`CREATE TYPE "end_diastolic_flow_enum" AS ENUM ('present','absent','reversed')`);
    await queryRunner.query(`CREATE TYPE "ductus_venosus_awave_enum" AS ENUM ('positive','absent','reversed')`);
    await queryRunner.query(`CREATE TYPE "present_absent_enum" AS ENUM ('present','absent')`);
    await queryRunner.query(`CREATE TYPE "amniotic_fluid_status_enum" AS ENUM ('normal','reduced','absent')`);
    await queryRunner.query(`CREATE TYPE "nst_result_enum" AS ENUM ('reactive','non_reactive','not_performed')`);

    // ── ultrasounds ──
    await queryRunner.query(`
      CREATE TABLE "ultrasounds" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"          uuid NOT NULL,
        "consultation_id"       uuid,
        "exam_type"             "us_exam_type_enum" NOT NULL,
        "exam_date"             date NOT NULL,
        "gestational_age_days"  integer NOT NULL,
        "operator_name"         character varying,
        "equipment_model"       character varying,
        "image_quality"         "image_quality_enum" NOT NULL DEFAULT 'good',
        "voice_transcript"      text,
        "ai_interpretation"     text,
        "final_report"          text,
        "report_status"         "report_status_enum" NOT NULL DEFAULT 'draft',
        "template_version"      character varying,
        "extra_fields"          jsonb,
        "created_at"            TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ultrasounds" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ultrasounds_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ultrasounds_consultation" FOREIGN KEY ("consultation_id")
          REFERENCES "consultations"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_ultrasounds_pregnancy_id" ON "ultrasounds" ("pregnancy_id")`);

    // ── fetal_biometries ──
    await queryRunner.query(`
      CREATE TABLE "fetal_biometries" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ultrasound_id"         uuid NOT NULL,
        "fetus_number"          integer NOT NULL DEFAULT 1,
        "bpd"                   numeric(6,2),
        "hc"                    numeric(6,2),
        "ac"                    numeric(6,2),
        "fl"                    numeric(6,2),
        "efw"                   numeric(7,1),
        "efw_percentile"        numeric(5,2),
        "crown_rump_length"     numeric(6,2),
        "nuchal_translucency"   numeric(4,2),
        "nasal_bone"            "nasal_bone_enum" NOT NULL DEFAULT 'not_evaluated',
        "amniotic_fluid_index"  numeric(5,2),
        "placenta_location"     character varying,
        "placenta_grade"        "placenta_grade_enum",
        "cervical_length"       numeric(5,2),
        "extra_fields"          jsonb,
        "created_at"            TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fetal_biometries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fetal_biometries_ultrasound" FOREIGN KEY ("ultrasound_id")
          REFERENCES "ultrasounds"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fetal_biometries_ultrasound_id" ON "fetal_biometries" ("ultrasound_id")`);

    // ── doppler_data ──
    await queryRunner.query(`
      CREATE TABLE "doppler_data" (
        "id"                      uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ultrasound_id"           uuid NOT NULL,
        "fetus_number"            integer NOT NULL DEFAULT 1,
        "umbilical_artery_pi"     numeric(5,3),
        "umbilical_artery_ri"     numeric(5,3),
        "umbilical_artery_sd"     numeric(5,2),
        "umbilical_artery_edf"    "end_diastolic_flow_enum",
        "mca_psv"                 numeric(6,2),
        "mca_pi"                  numeric(5,3),
        "uterine_artery_pi"       numeric(5,3),
        "uterine_artery_notch"    boolean,
        "ductus_venosus_pi"       numeric(5,3),
        "ductus_venosus_awave"    "ductus_venosus_awave_enum",
        "extra_fields"            jsonb,
        "created_at"              TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doppler_data" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doppler_data_ultrasound" FOREIGN KEY ("ultrasound_id")
          REFERENCES "ultrasounds"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_doppler_data_ultrasound_id" ON "doppler_data" ("ultrasound_id")`);

    // ── biophysical_profiles ──
    await queryRunner.query(`
      CREATE TABLE "biophysical_profiles" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ultrasound_id"     uuid NOT NULL,
        "fetus_number"      integer NOT NULL DEFAULT 1,
        "fetal_breathing"   "present_absent_enum" NOT NULL,
        "fetal_movement"    "present_absent_enum" NOT NULL,
        "fetal_tone"        "present_absent_enum" NOT NULL,
        "amniotic_fluid"    "amniotic_fluid_status_enum" NOT NULL,
        "nst_result"        "nst_result_enum" NOT NULL DEFAULT 'not_performed',
        "total_score"       integer NOT NULL,
        "interpretation"    character varying,
        "extra_fields"      jsonb,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_biophysical_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_biophysical_profiles_ultrasound" FOREIGN KEY ("ultrasound_id")
          REFERENCES "ultrasounds"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_biophysical_profiles_ultrasound_id" ON "biophysical_profiles" ("ultrasound_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "biophysical_profiles"`);
    await queryRunner.query(`DROP TABLE "doppler_data"`);
    await queryRunner.query(`DROP TABLE "fetal_biometries"`);
    await queryRunner.query(`DROP TABLE "ultrasounds"`);
    await queryRunner.query(`DROP TYPE "nst_result_enum"`);
    await queryRunner.query(`DROP TYPE "amniotic_fluid_status_enum"`);
    await queryRunner.query(`DROP TYPE "present_absent_enum"`);
    await queryRunner.query(`DROP TYPE "ductus_venosus_awave_enum"`);
    await queryRunner.query(`DROP TYPE "end_diastolic_flow_enum"`);
    await queryRunner.query(`DROP TYPE "placenta_grade_enum"`);
    await queryRunner.query(`DROP TYPE "nasal_bone_enum"`);
    await queryRunner.query(`DROP TYPE "report_status_enum"`);
    await queryRunner.query(`DROP TYPE "image_quality_enum"`);
    await queryRunner.query(`DROP TYPE "us_exam_type_enum"`);
  }
}
