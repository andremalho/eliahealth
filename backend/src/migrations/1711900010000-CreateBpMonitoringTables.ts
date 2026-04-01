import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBpMonitoringTables1711900010000 implements MigrationInterface {
  name = 'CreateBpMonitoringTables1711900010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "bp_condition_enum" AS ENUM ('chronic_hypertension','gestational_hypertension','preeclampsia','white_coat','monitoring_only')`);
    await queryRunner.query(`CREATE TYPE "bp_arm_enum" AS ENUM ('left','right','both')`);
    await queryRunner.query(`CREATE TYPE "bp_position_enum" AS ENUM ('sitting','lying','standing')`);
    await queryRunner.query(`CREATE TYPE "bp_status_enum" AS ENUM ('normal','attention','critical')`);
    await queryRunner.query(`CREATE TYPE "bp_reading_source_enum" AS ENUM ('manual','device_sync','patient_app')`);

    await queryRunner.query(`
      CREATE TABLE "bp_monitoring_configs" (
        "id"                          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"                uuid NOT NULL,
        "is_active"                   boolean NOT NULL DEFAULT false,
        "condition"                   "bp_condition_enum" NOT NULL,
        "target_systolic_max"         integer NOT NULL DEFAULT 140,
        "target_diastolic_max"        integer NOT NULL DEFAULT 90,
        "critical_systolic"           integer NOT NULL DEFAULT 160,
        "critical_diastolic"          integer NOT NULL DEFAULT 110,
        "measurement_frequency"       character varying,
        "antihypertensive_protocol"   text,
        "device_integration_id"       character varying,
        "device_brand"                character varying,
        "notes"                       text,
        "created_at"                  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bp_monitoring_configs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bp_configs_pregnancy" UNIQUE ("pregnancy_id"),
        CONSTRAINT "FK_bp_configs_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bp_readings" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"      uuid NOT NULL,
        "reading_date"      date NOT NULL,
        "reading_time"      time NOT NULL,
        "systolic"          integer NOT NULL,
        "diastolic"         integer NOT NULL,
        "heart_rate"        integer,
        "arm"               "bp_arm_enum" NOT NULL DEFAULT 'left',
        "position"          "bp_position_enum" NOT NULL DEFAULT 'sitting',
        "status"            "bp_status_enum" NOT NULL DEFAULT 'normal',
        "alert_triggered"   boolean NOT NULL DEFAULT false,
        "alert_message"     character varying,
        "symptoms"          jsonb,
        "symptoms_notes"    character varying,
        "source"            "bp_reading_source_enum" NOT NULL DEFAULT 'manual',
        "extra_fields"      jsonb,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bp_readings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bp_readings_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_bp_readings_pregnancy_date" ON "bp_readings" ("pregnancy_id", "reading_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_bp_readings_alert" ON "bp_readings" ("pregnancy_id", "alert_triggered") WHERE "alert_triggered" = true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bp_readings"`);
    await queryRunner.query(`DROP TABLE "bp_monitoring_configs"`);
    await queryRunner.query(`DROP TYPE "bp_reading_source_enum"`);
    await queryRunner.query(`DROP TYPE "bp_status_enum"`);
    await queryRunner.query(`DROP TYPE "bp_position_enum"`);
    await queryRunner.query(`DROP TYPE "bp_arm_enum"`);
    await queryRunner.query(`DROP TYPE "bp_condition_enum"`);
  }
}
