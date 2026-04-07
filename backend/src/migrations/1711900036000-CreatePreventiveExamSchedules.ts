import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePreventiveExamSchedules1711900036000
  implements MigrationInterface
{
  name = 'CreatePreventiveExamSchedules1711900036000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "womens_life_phase_enum" AS ENUM ('adolescence','young_adult','reproductive','perimenopause','early_menopause','late_menopause')`,
    );

    await queryRunner.query(`
      CREATE TABLE "preventive_exam_schedules" (
        "id"                          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"                   uuid,
        "patient_id"                  uuid NOT NULL,
        "generated_date"              date NOT NULL,
        "patient_age_at_generation"   integer NOT NULL,
        "life_phase"                  "womens_life_phase_enum" NOT NULL,
        "exam_schedule"               jsonb NOT NULL DEFAULT '[]',
        "vaccination_schedule"        jsonb,
        "clinical_alerts"             jsonb,
        "next_review_date"            date NOT NULL,
        "notes"                       text,
        "created_at"                  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_preventive_exam_schedules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_preventive_exam_schedules_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_preventive_exam_schedules_patient" ON "preventive_exam_schedules" ("patient_id", "generated_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_preventive_exam_schedules_tenant" ON "preventive_exam_schedules" ("tenant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_preventive_exam_schedules_tenant"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_preventive_exam_schedules_patient"`,
    );
    await queryRunner.query(`DROP TABLE "preventive_exam_schedules"`);
    await queryRunner.query(`DROP TYPE "womens_life_phase_enum"`);
  }
}
