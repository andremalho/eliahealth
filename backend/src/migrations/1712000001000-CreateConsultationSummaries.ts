import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConsultationSummaries1712000001000
  implements MigrationInterface
{
  name = 'CreateConsultationSummaries1712000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "consultation_summary_status_enum" AS ENUM ('generating', 'draft', 'approved', 'sent', 'delivered', 'read', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "consultation_summary_channel_enum" AS ENUM ('whatsapp', 'portal', 'both')`,
    );

    await queryRunner.query(`
      CREATE TABLE "consultation_summaries" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID,
        "consultation_id" UUID NOT NULL REFERENCES "consultations"("id") ON DELETE CASCADE,
        "patient_id" UUID NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "doctor_id" UUID NOT NULL,
        "summary_text" TEXT NOT NULL,
        "original_ai_text" TEXT,
        "source_data" JSONB,
        "status" "consultation_summary_status_enum" NOT NULL DEFAULT 'generating',
        "delivery_channel" "consultation_summary_channel_enum" NOT NULL DEFAULT 'both',
        "approved_at" TIMESTAMPTZ,
        "sent_at" TIMESTAMPTZ,
        "delivered_at" TIMESTAMPTZ,
        "read_at" TIMESTAMPTZ,
        "delivery_log" JSONB DEFAULT '[]'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_consultation_summaries_tenant" ON "consultation_summaries"("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_consultation_summaries_patient" ON "consultation_summaries"("patient_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_consultation_summaries_consultation" ON "consultation_summaries"("consultation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_consultation_summaries_status" ON "consultation_summaries"("status")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "consultation_summaries"`);
    await queryRunner.query(`DROP TYPE "consultation_summary_status_enum"`);
    await queryRunner.query(`DROP TYPE "consultation_summary_channel_enum"`);
  }
}
