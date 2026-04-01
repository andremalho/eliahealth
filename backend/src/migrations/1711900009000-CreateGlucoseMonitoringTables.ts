import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGlucoseMonitoringTables1711900009000 implements MigrationInterface {
  name = 'CreateGlucoseMonitoringTables1711900009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ──
    await queryRunner.query(`CREATE TYPE "diabetes_type_enum" AS ENUM ('gdm_a1','gdm_a2','type1','type2','other')`);
    await queryRunner.query(`CREATE TYPE "measurement_type_enum" AS ENUM ('fasting','post_breakfast_1h','post_lunch_1h','post_dinner_1h','post_breakfast_2h','post_lunch_2h','post_dinner_2h','bedtime','random','hypoglycemia')`);
    await queryRunner.query(`CREATE TYPE "glucose_status_enum" AS ENUM ('normal','attention','critical')`);
    await queryRunner.query(`CREATE TYPE "reading_source_enum" AS ENUM ('manual','device_sync','patient_app')`);
    await queryRunner.query(`CREATE TYPE "administration_time_label_enum" AS ENUM ('pre_breakfast','post_breakfast','pre_lunch','post_lunch','pre_dinner','post_dinner','bedtime_22h','correction')`);
    await queryRunner.query(`CREATE TYPE "administered_by_enum" AS ENUM ('patient','nurse','physician')`);

    // ── glucose_monitoring_configs ──
    await queryRunner.query(`
      CREATE TABLE "glucose_monitoring_configs" (
        "id"                      uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"            uuid NOT NULL,
        "is_active"               boolean NOT NULL DEFAULT false,
        "diabetes_type"           "diabetes_type_enum" NOT NULL,
        "target_fasting"          integer NOT NULL DEFAULT 95,
        "target_1h_post_meal"     integer NOT NULL DEFAULT 140,
        "target_2h_post_meal"     integer NOT NULL DEFAULT 120,
        "critical_threshold"      integer NOT NULL DEFAULT 200,
        "insulin_protocol"        text,
        "device_integration_id"   character varying,
        "device_brand"            character varying,
        "notes"                   text,
        "created_at"              TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_glucose_monitoring_configs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_glucose_configs_pregnancy" UNIQUE ("pregnancy_id"),
        CONSTRAINT "FK_glucose_configs_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);

    // ── glucose_readings ──
    await queryRunner.query(`
      CREATE TABLE "glucose_readings" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"      uuid NOT NULL,
        "reading_date"      date NOT NULL,
        "reading_time"      time NOT NULL,
        "measurement_type"  "measurement_type_enum" NOT NULL,
        "glucose_value"     integer NOT NULL,
        "status"            "glucose_status_enum" NOT NULL DEFAULT 'normal',
        "alert_triggered"   boolean NOT NULL DEFAULT false,
        "alert_message"     character varying,
        "symptoms"          jsonb,
        "symptoms_notes"    character varying,
        "source"            "reading_source_enum" NOT NULL DEFAULT 'manual',
        "extra_fields"      jsonb,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_glucose_readings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_glucose_readings_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_glucose_readings_pregnancy_date" ON "glucose_readings" ("pregnancy_id", "reading_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_glucose_readings_alert" ON "glucose_readings" ("pregnancy_id", "alert_triggered") WHERE "alert_triggered" = true`);

    // ── insulin_doses ──
    await queryRunner.query(`
      CREATE TABLE "insulin_doses" (
        "id"                          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"                uuid NOT NULL,
        "glucose_reading_id"          uuid,
        "administration_date"         date NOT NULL,
        "administration_time"         time NOT NULL,
        "administration_time_label"   "administration_time_label_enum" NOT NULL,
        "insulin_type"                character varying NOT NULL,
        "dose_units"                  numeric(5,1) NOT NULL,
        "prescribed_dose"             numeric(5,1),
        "administered_by"             "administered_by_enum" NOT NULL,
        "notes"                       character varying,
        "extra_fields"                jsonb,
        "created_at"                  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_insulin_doses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_insulin_doses_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_insulin_doses_reading" FOREIGN KEY ("glucose_reading_id")
          REFERENCES "glucose_readings"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_insulin_doses_pregnancy_date" ON "insulin_doses" ("pregnancy_id", "administration_date")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "insulin_doses"`);
    await queryRunner.query(`DROP TABLE "glucose_readings"`);
    await queryRunner.query(`DROP TABLE "glucose_monitoring_configs"`);
    await queryRunner.query(`DROP TYPE "administered_by_enum"`);
    await queryRunner.query(`DROP TYPE "administration_time_label_enum"`);
    await queryRunner.query(`DROP TYPE "reading_source_enum"`);
    await queryRunner.query(`DROP TYPE "glucose_status_enum"`);
    await queryRunner.query(`DROP TYPE "measurement_type_enum"`);
    await queryRunner.query(`DROP TYPE "diabetes_type_enum"`);
  }
}
