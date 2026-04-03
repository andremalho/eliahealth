import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVaccinesSwabsFatherFilesPrescriptions1711900014000 implements MigrationInterface {
  name = 'CreateVaccinesSwabsFatherFilesPrescriptions1711900014000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── vaccines ──
    await queryRunner.query(`CREATE TYPE "vaccine_type_enum" AS ENUM ('influenza','tdap','hepatitis_b','covid19','other')`);
    await queryRunner.query(`CREATE TYPE "vaccine_status_enum" AS ENUM ('scheduled','administered','overdue','refused')`);
    await queryRunner.query(`
      CREATE TABLE "vaccines" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"      uuid NOT NULL,
        "vaccine_name"      character varying NOT NULL,
        "vaccine_type"      "vaccine_type_enum" NOT NULL,
        "dose_number"       integer NOT NULL DEFAULT 1,
        "scheduled_date"    date,
        "administered_date" date,
        "status"            "vaccine_status_enum" NOT NULL DEFAULT 'scheduled',
        "batch_number"      character varying,
        "administered_by"   character varying,
        "location"          character varying,
        "next_dose_date"    date,
        "notes"             character varying,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vaccines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vaccines_pregnancy" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_vaccines_pregnancy_id" ON "vaccines" ("pregnancy_id")`);

    // ── vaginal_swabs ──
    await queryRunner.query(`CREATE TYPE "swab_exam_type_enum" AS ENUM ('oncotic_cytology','streptococcus_b','bacterial_vaginosis','candida','trichomonas','chlamydia','gonorrhea','other')`);
    await queryRunner.query(`CREATE TYPE "swab_status_enum" AS ENUM ('pending','normal','altered','critical')`);
    await queryRunner.query(`
      CREATE TABLE "vaginal_swabs" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"      uuid NOT NULL,
        "collection_date"   date NOT NULL,
        "exam_type"         "swab_exam_type_enum" NOT NULL,
        "result"            character varying,
        "status"            "swab_status_enum" NOT NULL DEFAULT 'pending',
        "alert_triggered"   boolean NOT NULL DEFAULT false,
        "alert_message"     character varying,
        "notes"             character varying,
        "lab_name"          character varying,
        "attachment_url"    character varying,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vaginal_swabs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vaginal_swabs_pregnancy" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_vaginal_swabs_pregnancy_id" ON "vaginal_swabs" ("pregnancy_id")`);

    // ── biological_fathers ──
    await queryRunner.query(`CREATE TYPE "rh_factor_enum" AS ENUM ('positive','negative')`);
    await queryRunner.query(`
      CREATE TABLE "biological_fathers" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"        uuid NOT NULL,
        "name"                character varying,
        "age"                 integer,
        "blood_type"          character varying,
        "rh"                  "rh_factor_enum",
        "genetic_conditions"  text,
        "infectious_diseases" text,
        "family_history"      text,
        "observations"        text,
        "created_at"          TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_biological_fathers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_biological_fathers_pregnancy" UNIQUE ("pregnancy_id"),
        CONSTRAINT "FK_biological_fathers_pregnancy" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);

    // ── pregnancy_files ──
    await queryRunner.query(`CREATE TYPE "pregnancy_file_type_enum" AS ENUM ('exam','ultrasound','prescription','referral','report','other')`);
    await queryRunner.query(`
      CREATE TABLE "pregnancy_files" (
        "id"                      uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"            uuid NOT NULL,
        "uploaded_by"             uuid NOT NULL,
        "file_name"               character varying NOT NULL,
        "file_type"               "pregnancy_file_type_enum" NOT NULL,
        "mime_type"               character varying NOT NULL,
        "file_size"               integer NOT NULL,
        "file_url"                character varying NOT NULL,
        "description"             character varying,
        "is_visible_to_patient"   boolean NOT NULL DEFAULT false,
        "created_at"              TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pregnancy_files" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pregnancy_files_pregnancy" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pregnancy_files_user" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_pregnancy_files_pregnancy_id" ON "pregnancy_files" ("pregnancy_id")`);

    // ── prescriptions ──
    await queryRunner.query(`CREATE TYPE "prescription_status_enum" AS ENUM ('active','completed','cancelled')`);
    await queryRunner.query(`
      CREATE TABLE "prescriptions" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"        uuid NOT NULL,
        "consultation_id"     uuid,
        "prescribed_by"       uuid NOT NULL,
        "prescription_date"   date NOT NULL,
        "medications"         jsonb NOT NULL DEFAULT '[]',
        "status"              "prescription_status_enum" NOT NULL DEFAULT 'active',
        "notes"               text,
        "digital_signature"   character varying,
        "created_at"          TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_prescriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_prescriptions_pregnancy" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_prescriptions_consultation" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_prescriptions_user" FOREIGN KEY ("prescribed_by") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_prescriptions_pregnancy_id" ON "prescriptions" ("pregnancy_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "prescriptions"`);
    await queryRunner.query(`DROP TYPE "prescription_status_enum"`);
    await queryRunner.query(`DROP TABLE "pregnancy_files"`);
    await queryRunner.query(`DROP TYPE "pregnancy_file_type_enum"`);
    await queryRunner.query(`DROP TABLE "biological_fathers"`);
    await queryRunner.query(`DROP TYPE "rh_factor_enum"`);
    await queryRunner.query(`DROP TABLE "vaginal_swabs"`);
    await queryRunner.query(`DROP TYPE "swab_status_enum"`);
    await queryRunner.query(`DROP TYPE "swab_exam_type_enum"`);
    await queryRunner.query(`DROP TABLE "vaccines"`);
    await queryRunner.query(`DROP TYPE "vaccine_status_enum"`);
    await queryRunner.query(`DROP TYPE "vaccine_type_enum"`);
  }
}
