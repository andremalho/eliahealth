import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSecretaryAssignments1711900053000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "secretary_assignments" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "secretary_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "doctor_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "assigned_by" uuid REFERENCES "users"("id"),
        "is_active" boolean DEFAULT true,
        "created_at" timestamptz DEFAULT now(),
        UNIQUE("secretary_id", "doctor_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_secretary_assignments_secretary" ON "secretary_assignments" ("secretary_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "idx_secretary_assignments_doctor" ON "secretary_assignments" ("doctor_id", "is_active")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "secretary_assignments"`);
  }
}
