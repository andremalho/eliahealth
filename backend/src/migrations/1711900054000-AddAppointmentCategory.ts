import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentCategory1711900054000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "appointment_category_enum" AS ENUM ('primeira_consulta','retorno','particular','convenio','urgencia','encaixe')`);
    const col = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'category'`,
    );
    if (col.length === 0) {
      await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN "category" "appointment_category_enum"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "category"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_category_enum"`);
  }
}
