import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedAdminUser1711900006001 implements MigrationInterface {
  name = 'SeedAdminUser1711900006001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hash = await bcrypt.hash('Admin@2025', 12);

    await queryRunner.query(`
      INSERT INTO "users" ("name", "email", "password", "role")
      SELECT 'Administrador', 'admin@eliahealth.com', '${hash}', 'admin'
      WHERE NOT EXISTS (
        SELECT 1 FROM "users" WHERE "email" = 'admin@eliahealth.com'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "users" WHERE "email" = 'admin@eliahealth.com'
    `);
  }
}
