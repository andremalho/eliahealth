import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceptionistRole1711900051000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ALTER TYPE ADD VALUE cannot run inside a transaction
    await queryRunner.query(`ALTER TYPE "user_role_enum" ADD VALUE IF NOT EXISTS 'receptionist'`);
  }

  public async down(): Promise<void> {
    // Postgres does not support removing enum values
  }
}
