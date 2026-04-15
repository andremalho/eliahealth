import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCertificateAuthConfig1712000005000 implements MigrationInterface {
  name = 'AddCertificateAuthConfig1712000005000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar campos de certificado digital no tenant_configs
    await queryRunner.query(`
      ALTER TABLE "tenant_configs"
        ADD COLUMN "certificate_validity_days" INT NOT NULL DEFAULT 365,
        ADD COLUMN "certificate_required" BOOLEAN NOT NULL DEFAULT false
    `);

    // Adicionar campo de certificado digital no users
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "certificate_thumbprint" VARCHAR(64),
        ADD COLUMN "certificate_subject" VARCHAR(500),
        ADD COLUMN "certificate_issuer" VARCHAR(500),
        ADD COLUMN "certificate_expires_at" TIMESTAMPTZ,
        ADD COLUMN "certificate_registered_at" TIMESTAMPTZ
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_users_certificate" ON "users"("certificate_thumbprint") WHERE "certificate_thumbprint" IS NOT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_users_certificate"`);
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "certificate_thumbprint",
        DROP COLUMN "certificate_subject",
        DROP COLUMN "certificate_issuer",
        DROP COLUMN "certificate_expires_at",
        DROP COLUMN "certificate_registered_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_configs"
        DROP COLUMN "certificate_validity_days",
        DROP COLUMN "certificate_required"
    `);
  }
}
