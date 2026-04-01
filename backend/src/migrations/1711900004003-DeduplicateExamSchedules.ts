import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeduplicateExamSchedules1711900004003 implements MigrationInterface {
  name = 'DeduplicateExamSchedules1711900004003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover duplicatas mantendo o registro mais antigo (menor created_at) por (exam_name, trimester)
    await queryRunner.query(`
      DELETE FROM "exam_schedules"
      WHERE "id" NOT IN (
        SELECT DISTINCT ON ("exam_name", "trimester") "id"
        FROM "exam_schedules"
        ORDER BY "exam_name", "trimester", "created_at" ASC
      )
    `);

    // 2. Constraint UNIQUE composta para evitar duplicatas futuras
    await queryRunner.query(`
      ALTER TABLE "exam_schedules"
      ADD CONSTRAINT "UQ_exam_schedules_name_trimester"
      UNIQUE ("exam_name", "trimester")
    `);

    // 3. Adicionar campo schedule_id na tabela lab_results para vinculo explicito
    await queryRunner.query(`
      ALTER TABLE "lab_results"
      ADD COLUMN "schedule_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "lab_results"
      ADD CONSTRAINT "FK_lab_results_schedule"
      FOREIGN KEY ("schedule_id") REFERENCES "exam_schedules"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_lab_results_schedule_id" ON "lab_results" ("schedule_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_lab_results_schedule_id"`);
    await queryRunner.query(`ALTER TABLE "lab_results" DROP CONSTRAINT "FK_lab_results_schedule"`);
    await queryRunner.query(`ALTER TABLE "lab_results" DROP COLUMN "schedule_id"`);
    await queryRunner.query(`ALTER TABLE "exam_schedules" DROP CONSTRAINT "UQ_exam_schedules_name_trimester"`);
  }
}
