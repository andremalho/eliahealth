import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCopilotAlerts1711900005000 implements MigrationInterface {
  name = 'CreateCopilotAlerts1711900005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "alert_type_enum" AS ENUM (
        'pattern_detected', 'exam_overdue', 'red_flag', 'suggestion', 'risk_increase'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "alert_severity_enum" AS ENUM ('info', 'warning', 'urgent', 'critical')
    `);

    await queryRunner.query(`
      CREATE TABLE "copilot_alerts" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"     uuid NOT NULL,
        "consultation_id"  uuid,
        "alert_type"       "alert_type_enum" NOT NULL,
        "severity"         "alert_severity_enum" NOT NULL,
        "title"            character varying NOT NULL,
        "message"          text NOT NULL,
        "recommendation"   text NOT NULL,
        "triggered_by"     character varying NOT NULL,
        "is_read"          boolean NOT NULL DEFAULT false,
        "is_resolved"      boolean NOT NULL DEFAULT false,
        "ai_generated"     boolean NOT NULL DEFAULT true,
        "created_at"       TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_copilot_alerts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_copilot_alerts_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_copilot_alerts_consultation" FOREIGN KEY ("consultation_id")
          REFERENCES "consultations"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_copilot_alerts_pregnancy_id" ON "copilot_alerts" ("pregnancy_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_copilot_alerts_severity" ON "copilot_alerts" ("severity")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_copilot_alerts_unresolved"
      ON "copilot_alerts" ("pregnancy_id", "is_resolved")
      WHERE "is_resolved" = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "copilot_alerts"`);
    await queryRunner.query(`DROP TYPE "alert_severity_enum"`);
    await queryRunner.query(`DROP TYPE "alert_type_enum"`);
  }
}
