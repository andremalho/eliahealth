import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostpartumConsultations1711900049000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`CREATE TYPE "lochia_type_enum" AS ENUM ('rubra','serosa','alba','absent')`);
    await queryRunner.query(`CREATE TYPE "lochia_amount_enum" AS ENUM ('scant','moderate','heavy')`);
    await queryRunner.query(`CREATE TYPE "wound_status_enum" AS ENUM ('good','dehiscence','infection','hematoma','not_applicable')`);
    await queryRunner.query(`CREATE TYPE "uterine_involution_enum" AS ENUM ('normal','subinvolution','not_palpable')`);
    await queryRunner.query(`CREATE TYPE "breastfeeding_status_enum" AS ENUM ('exclusive','predominant','complemented','not_breastfeeding')`);
    await queryRunner.query(`CREATE TYPE "breast_condition_enum" AS ENUM ('normal','engorgement','fissure','mastitis','abscess')`);
    await queryRunner.query(`CREATE TYPE "mood_screening_enum" AS ENUM ('normal','mild','moderate','severe')`);

    await queryRunner.query(`
      CREATE TABLE "postpartum_consultations" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id" uuid,
        "pregnancy_id" uuid NOT NULL REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "days_postpartum" int NOT NULL DEFAULT 0,

        -- Sinais vitais
        "weight_kg" decimal(5,2),
        "bp_systolic" int,
        "bp_diastolic" int,
        "temperature" decimal(3,1),
        "heart_rate" int,

        -- Útero e lóquios
        "uterine_involution" "uterine_involution_enum",
        "fundal_height_cm" decimal(4,1),
        "lochia_type" "lochia_type_enum",
        "lochia_amount" "lochia_amount_enum",
        "lochia_odor" boolean,

        -- Ferida
        "wound_status" "wound_status_enum",
        "wound_notes" text,

        -- Mamas
        "breastfeeding_status" "breastfeeding_status_enum",
        "breast_condition" "breast_condition_enum",
        "breastfeeding_notes" text,

        -- Saúde mental
        "mood_screening" "mood_screening_enum",
        "epds_score" int,
        "mood_notes" text,

        -- Contracepção
        "contraception_discussed" boolean,
        "contraception_method" varchar,

        -- Dados do RN
        "newborn_data" jsonb,

        -- SOAP
        "subjective" text,
        "objective" text,
        "assessment" text,
        "plan" text,
        "confidential_notes" text,
        "next_appointment_date" date,
        "alerts" jsonb,

        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_postpartum_pregnancy" ON "postpartum_consultations" ("pregnancy_id")`);
    await queryRunner.query(`CREATE INDEX "idx_postpartum_date" ON "postpartum_consultations" ("pregnancy_id", "date")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "postpartum_consultations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "mood_screening_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "breast_condition_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "breastfeeding_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "uterine_involution_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "wound_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "lochia_amount_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "lochia_type_enum"`);
  }
}
