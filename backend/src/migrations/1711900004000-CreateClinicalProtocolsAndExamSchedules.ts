import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicalProtocolsAndExamSchedules1711900004000 implements MigrationInterface {
  name = 'CreateClinicalProtocolsAndExamSchedules1711900004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "protocol_category_enum" AS ENUM (
        'prenatal_routine', 'screening_fmf', 'red_flag', 'copilot_alert',
        'exam_schedule', 'medication', 'vaccine', 'guideline'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "protocol_priority_enum" AS ENUM ('routine', 'important', 'urgent', 'critical')
    `);

    await queryRunner.query(`
      CREATE TYPE "trimester_enum" AS ENUM ('1st', '2nd', '3rd', 'all')
    `);

    await queryRunner.query(`
      CREATE TABLE "clinical_protocols" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title"             character varying NOT NULL,
        "category"          "protocol_category_enum" NOT NULL,
        "source"            character varying NOT NULL,
        "ga_weeks_min"      integer,
        "ga_weeks_max"      integer,
        "trigger_condition" character varying,
        "content"           text NOT NULL,
        "action_items"      jsonb NOT NULL DEFAULT '[]',
        "priority"          "protocol_priority_enum" NOT NULL,
        "is_active"         boolean NOT NULL DEFAULT true,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clinical_protocols" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "exam_schedules" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "exam_name"       character varying NOT NULL,
        "exam_category"   character varying NOT NULL,
        "ga_weeks_ideal"  integer NOT NULL,
        "ga_weeks_min"    integer NOT NULL,
        "ga_weeks_max"    integer NOT NULL,
        "trimester"       "trimester_enum" NOT NULL,
        "is_routine"      boolean NOT NULL,
        "indication"      character varying,
        "notes"           text,
        "source"          character varying NOT NULL,
        "is_active"       boolean NOT NULL DEFAULT true,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exam_schedules" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_clinical_protocols_category" ON "clinical_protocols" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_exam_schedules_trimester" ON "exam_schedules" ("trimester")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "exam_schedules"`);
    await queryRunner.query(`DROP TABLE "clinical_protocols"`);
    await queryRunner.query(`DROP TYPE "trimester_enum"`);
    await queryRunner.query(`DROP TYPE "protocol_priority_enum"`);
    await queryRunner.query(`DROP TYPE "protocol_category_enum"`);
  }
}
