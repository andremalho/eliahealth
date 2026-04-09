import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePortalOtps1711900047000 implements MigrationInterface {
  name = 'CreatePortalOtps1711900047000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "portal_otps" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_id" uuid NOT NULL,
        "code" varchar(6) NOT NULL,
        "channel" varchar(20) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz,
        "attempts" int NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_portal_otps_patient" ON "portal_otps" ("patient_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "portal_otps"`);
  }
}
