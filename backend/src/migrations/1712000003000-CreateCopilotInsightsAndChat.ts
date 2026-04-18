import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCopilotInsightsAndChat1712000003000
  implements MigrationInterface
{
  name = 'CreateCopilotInsightsAndChat1712000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Colisão de nome: migration 1711900063000 cria chat_messages com schema legado
    // (patient_id/doctor_id/sender_type). Este módulo precisa do schema novo
    // (session_id/metadata) usado por patient-chat/analytics/copilot-dashboard.
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages" CASCADE`);

    // ── Fase 3: copilot_insights ──
    await queryRunner.query(
      `CREATE TYPE "copilot_insight_type_enum" AS ENUM ('anamnesis_gap', 'differential', 'drug_interaction', 'contraindication', 'contextual_alert', 'exam_suggestion', 'guideline_reminder', 'trend_alert')`,
    );
    await queryRunner.query(
      `CREATE TYPE "copilot_trigger_event_enum" AS ENUM ('chief_complaint', 'vital_signs', 'physical_exam', 'diagnosis_added', 'diagnosis_removed', 'prescription_added', 'exam_requested', 'orientation_added', 'explicit_request')`,
    );

    await queryRunner.query(`
      CREATE TABLE "copilot_insights" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID,
        "consultation_id" UUID NOT NULL REFERENCES "consultations"("id") ON DELETE CASCADE,
        "patient_id" UUID NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "doctor_id" UUID NOT NULL,
        "type" "copilot_insight_type_enum" NOT NULL,
        "triggered_by" "copilot_trigger_event_enum" NOT NULL,
        "title" VARCHAR(300) NOT NULL,
        "description" TEXT NOT NULL,
        "suggested_action" TEXT,
        "guideline_reference" VARCHAR(200),
        "severity" VARCHAR(20) NOT NULL DEFAULT 'attention',
        "doctor_action" VARCHAR(20),
        "doctor_note" TEXT,
        "generation_time_ms" INT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_copilot_insights_consultation" ON "copilot_insights"("consultation_id")`);
    await queryRunner.query(`CREATE INDEX "idx_copilot_insights_doctor" ON "copilot_insights"("doctor_id")`);

    // ── Fase 4a: chat ──
    await queryRunner.query(
      `CREATE TYPE "chat_message_role_enum" AS ENUM ('patient', 'assistant', 'system')`,
    );
    await queryRunner.query(
      `CREATE TYPE "chat_session_status_enum" AS ENUM ('active', 'closed', 'escalated')`,
    );

    await queryRunner.query(`
      CREATE TABLE "chat_sessions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID,
        "patient_id" UUID NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "consultation_id" UUID REFERENCES "consultations"("id") ON DELETE SET NULL,
        "summary_id" UUID REFERENCES "consultation_summaries"("id") ON DELETE SET NULL,
        "doctor_id" UUID,
        "whatsapp_number" VARCHAR(20) NOT NULL,
        "status" "chat_session_status_enum" NOT NULL DEFAULT 'active',
        "consultation_context" JSONB,
        "message_count" INT NOT NULL DEFAULT 0,
        "escalated_to_doctor" BOOLEAN NOT NULL DEFAULT false,
        "escalated_at" TIMESTAMPTZ,
        "escalation_reason" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "session_id" UUID NOT NULL REFERENCES "chat_sessions"("id") ON DELETE CASCADE,
        "role" "chat_message_role_enum" NOT NULL,
        "content" TEXT NOT NULL,
        "metadata" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_chat_sessions_patient" ON "chat_sessions"("patient_id")`);
    await queryRunner.query(`CREATE INDEX "idx_chat_sessions_whatsapp" ON "chat_sessions"("whatsapp_number")`);
    await queryRunner.query(`CREATE INDEX "idx_chat_sessions_status" ON "chat_sessions"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_chat_messages_session" ON "chat_messages"("session_id")`);

    // ── Fase 4b: longitudinal_alerts ──
    await queryRunner.query(`
      CREATE TABLE "longitudinal_alerts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID,
        "doctor_id" UUID NOT NULL,
        "patient_id" UUID,
        "alert_type" VARCHAR(50) NOT NULL,
        "title" VARCHAR(300) NOT NULL,
        "description" TEXT NOT NULL,
        "suggested_action" TEXT,
        "severity" VARCHAR(20) NOT NULL DEFAULT 'attention',
        "read_by_doctor" BOOLEAN NOT NULL DEFAULT false,
        "acted_upon" BOOLEAN NOT NULL DEFAULT false,
        "doctor_response" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_longitudinal_alerts_doctor" ON "longitudinal_alerts"("doctor_id")`);
    await queryRunner.query(`CREATE INDEX "idx_longitudinal_alerts_tenant" ON "longitudinal_alerts"("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "idx_longitudinal_alerts_read" ON "longitudinal_alerts"("read_by_doctor")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "longitudinal_alerts"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(`DROP TABLE "chat_sessions"`);
    await queryRunner.query(`DROP TABLE "copilot_insights"`);
    await queryRunner.query(`DROP TYPE "chat_session_status_enum"`);
    await queryRunner.query(`DROP TYPE "chat_message_role_enum"`);
    await queryRunner.query(`DROP TYPE "copilot_trigger_event_enum"`);
    await queryRunner.query(`DROP TYPE "copilot_insight_type_enum"`);
  }
}
