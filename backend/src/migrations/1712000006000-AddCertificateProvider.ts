import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCertificateProvider1712000006000 implements MigrationInterface {
  name = 'AddCertificateProvider1712000006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "certificate_provider_enum" AS ENUM ('icp_brasil', 'bird_id', 'certisign', 'valid', 'safeid', 'vidaas', 'other')`,
    );

    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "certificate_provider" "certificate_provider_enum",
        ADD COLUMN "certificate_token" VARCHAR(500),
        ADD COLUMN "certificate_token_expires_at" TIMESTAMPTZ
    `);

    // Configuracao de providers permitidos no tenant
    await queryRunner.query(`
      ALTER TABLE "tenant_configs"
        ADD COLUMN "certificate_providers" JSONB NOT NULL DEFAULT '["icp_brasil","bird_id","certisign","valid"]'::jsonb
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenant_configs" DROP COLUMN "certificate_providers"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "certificate_token_expires_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "certificate_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "certificate_provider"`);
    await queryRunner.query(`DROP TYPE "certificate_provider_enum"`);
  }
}
