import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePublicShares1711900032000 implements MigrationInterface {
  name = 'CreatePublicShares1711900032000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public_shares" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"    uuid NOT NULL,
        "patient_id"      uuid NOT NULL,
        "share_token"     uuid NOT NULL,
        "expires_at"      TIMESTAMP WITH TIME ZONE NOT NULL,
        "access_count"    integer NOT NULL DEFAULT 0,
        "revoked"         boolean NOT NULL DEFAULT false,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_public_shares" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_public_shares_token" UNIQUE ("share_token"),
        CONSTRAINT "FK_public_shares_pregnancy" FOREIGN KEY ("pregnancy_id")
          REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_public_shares_token" ON "public_shares" ("share_token")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_public_shares_patient_id" ON "public_shares" ("patient_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "public_shares"`);
  }
}
