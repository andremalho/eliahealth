import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatMessages1711900063000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id" uuid,
        "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "doctor_id" uuid NOT NULL REFERENCES "users"("id"),
        "sender_type" varchar NOT NULL CHECK (sender_type IN ('doctor','patient')),
        "content" text NOT NULL,
        "attachment_url" varchar,
        "read_at" timestamptz,
        "created_at" timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_chat_patient_doctor" ON "chat_messages" ("patient_id", "doctor_id", "created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX "idx_chat_unread" ON "chat_messages" ("doctor_id", "sender_type", "read_at") WHERE read_at IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
  }
}
