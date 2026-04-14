import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCopilotChecks1712000002000 implements MigrationInterface {
  name = 'CreateCopilotChecks1712000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "copilot_check_context_enum" AS ENUM ('prenatal', 'gynecology', 'fertility', 'art', 'menopause', 'preventive', 'general')`,
    );
    await queryRunner.query(
      `CREATE TYPE "copilot_check_severity_enum" AS ENUM ('ok', 'attention', 'action_required')`,
    );
    await queryRunner.query(
      `CREATE TYPE "copilot_check_category_enum" AS ENUM ('exam', 'prescription', 'screening', 'vaccine', 'referral', 'monitoring', 'follow_up', 'anamnesis_gap', 'drug_interaction', 'contraindication')`,
    );
    await queryRunner.query(
      `CREATE TYPE "copilot_check_resolution_enum" AS ENUM ('accepted', 'ignored', 'already_done', 'deferred')`,
    );

    await queryRunner.query(`
      CREATE TABLE "copilot_checks" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID,
        "consultation_id" UUID NOT NULL REFERENCES "consultations"("id") ON DELETE CASCADE,
        "patient_id" UUID NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "doctor_id" UUID NOT NULL,
        "clinical_context" "copilot_check_context_enum" NOT NULL DEFAULT 'general',
        "total_items" INT NOT NULL DEFAULT 0,
        "action_required_count" INT NOT NULL DEFAULT 0,
        "attention_count" INT NOT NULL DEFAULT 0,
        "ok_count" INT NOT NULL DEFAULT 0,
        "reviewed_by_doctor" BOOLEAN NOT NULL DEFAULT false,
        "reviewed_at" TIMESTAMPTZ,
        "generation_time_ms" INT,
        "source_snapshot" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "copilot_check_items" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "copilot_check_id" UUID NOT NULL REFERENCES "copilot_checks"("id") ON DELETE CASCADE,
        "severity" "copilot_check_severity_enum" NOT NULL,
        "category" "copilot_check_category_enum" NOT NULL,
        "title" VARCHAR(500) NOT NULL,
        "description" TEXT NOT NULL,
        "suggested_action" TEXT,
        "guideline_reference" VARCHAR(200),
        "resolution" "copilot_check_resolution_enum",
        "resolution_note" TEXT,
        "resolved_at" TIMESTAMPTZ,
        "display_order" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_copilot_checks_tenant" ON "copilot_checks"("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "idx_copilot_checks_consultation" ON "copilot_checks"("consultation_id")`);
    await queryRunner.query(`CREATE INDEX "idx_copilot_checks_doctor" ON "copilot_checks"("doctor_id")`);
    await queryRunner.query(`CREATE INDEX "idx_copilot_checks_patient" ON "copilot_checks"("patient_id")`);
    await queryRunner.query(`CREATE INDEX "idx_copilot_check_items_check" ON "copilot_check_items"("copilot_check_id")`);
    await queryRunner.query(`CREATE INDEX "idx_copilot_check_items_severity" ON "copilot_check_items"("severity")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "copilot_check_items"`);
    await queryRunner.query(`DROP TABLE "copilot_checks"`);
    await queryRunner.query(`DROP TYPE "copilot_check_resolution_enum"`);
    await queryRunner.query(`DROP TYPE "copilot_check_category_enum"`);
    await queryRunner.query(`DROP TYPE "copilot_check_severity_enum"`);
    await queryRunner.query(`DROP TYPE "copilot_check_context_enum"`);
  }
}
