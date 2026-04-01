import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1711900006000 implements MigrationInterface {
  name = 'CreateUsers1711900006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('physician', 'admin', 'nurse', 'patient')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"                character varying NOT NULL,
        "email"               character varying NOT NULL,
        "password"            character varying NOT NULL,
        "role"                "user_role_enum" NOT NULL DEFAULT 'physician',
        "crm"                 character varying,
        "coren"               character varying,
        "specialty"           character varying,
        "tenant_id"           character varying,
        "is_active"           boolean NOT NULL DEFAULT true,
        "refresh_token_hash"  character varying,
        "created_at"          TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
