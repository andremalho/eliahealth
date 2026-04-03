import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSwabTypesAndNotifications1711900022000
  implements MigrationInterface
{
  name = 'AddSwabTypesAndNotifications1711900022000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // New swab exam types
    const newSwabTypes = [
      'colpocitologia_oncotica',
      'pcr_streptococcus',
      'pcr_chlamydia',
      'pcr_gonorrhea',
      'pcr_hpv',
    ];
    for (const val of newSwabTypes) {
      await queryRunner.query(
        `ALTER TYPE "swab_exam_type_enum" ADD VALUE IF NOT EXISTS '${val}'`,
      );
    }

    // Result dropdown enum
    await queryRunner.query(`
      CREATE TYPE "swab_result_dropdown_enum" AS ENUM (
        'negative', 'positive', 'low_risk', 'high_risk'
      )
    `);

    // Add result_dropdown column to vaginal_swabs
    await queryRunner.query(`
      ALTER TABLE "vaginal_swabs"
        ADD COLUMN "result_dropdown" "swab_result_dropdown_enum"
    `);

    // Notification enums
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM ('email', 'whatsapp', 'sms', 'push')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_template_enum" AS ENUM (
        'portal_invite', 'appointment_reminder', 'exam_result', 'alert', 'other'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_status_enum" AS ENUM ('pending', 'sent', 'delivered', 'failed')
    `);

    // Notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"  uuid,
        "patient_id"    uuid NOT NULL,
        "type"          "notification_type_enum" NOT NULL,
        "template"      "notification_template_enum" NOT NULL,
        "status"        "notification_status_enum" NOT NULL DEFAULT 'pending',
        "sent_at"       TIMESTAMP WITH TIME ZONE,
        "content"       text NOT NULL,
        "metadata"      jsonb,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_pregnancy_id" ON "notifications" ("pregnancy_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_patient_id" ON "notifications" ("patient_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE "notification_template_enum"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);

    await queryRunner.query(`
      ALTER TABLE "vaginal_swabs" DROP COLUMN "result_dropdown"
    `);
    await queryRunner.query(`DROP TYPE "swab_result_dropdown_enum"`);

    // Enum values for swab types cannot be removed without recreating
  }
}
