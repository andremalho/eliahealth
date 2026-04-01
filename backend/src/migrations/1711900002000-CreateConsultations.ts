import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConsultations1711900002000 implements MigrationInterface {
  name = 'CreateConsultations1711900002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "edema_grade_enum" AS ENUM ('none', '1+', '2+', '3+', '4+')
    `);

    await queryRunner.query(`
      CREATE TABLE "consultations" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"          uuid NOT NULL,
        "date"                  date NOT NULL,
        "gestational_age_days"  integer NOT NULL,
        "weight_kg"             numeric(5,2),
        "bp_systolic"           integer,
        "bp_diastolic"          integer,
        "fundal_height_cm"      numeric(4,1),
        "fetal_heart_rate"      integer,
        "edema_grade"           "edema_grade_enum",
        "subjective"            text,
        "objective"             text,
        "assessment"            text,
        "plan"                  text,
        "ai_suggestions"        jsonb,
        "created_at"            TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_consultations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_consultations_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_consultations_pregnancy_id" ON "consultations" ("pregnancy_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "consultations"`);
    await queryRunner.query(`DROP TYPE "edema_grade_enum"`);
  }
}
