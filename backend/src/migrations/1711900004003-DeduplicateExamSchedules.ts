import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeduplicateExamSchedules1711900004003 implements MigrationInterface {
  name = 'DeduplicateExamSchedules1711900004003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover duplicatas mantendo o registro mais antigo (menor created_at) por (exam_name, trimester)
    //    Usa CTE para garantir que funciona mesmo com muitas duplicatas
    await queryRunner.query(`
      DELETE FROM "exam_schedules"
      WHERE "id" IN (
        SELECT "id" FROM (
          SELECT "id",
            ROW_NUMBER() OVER (PARTITION BY "exam_name", "trimester" ORDER BY "created_at" ASC) AS rn
          FROM "exam_schedules"
        ) ranked
        WHERE ranked.rn > 1
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
      ADD COLUMN IF NOT EXISTS "schedule_id" uuid
    `);

    // 4. FK somente se nao existir
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_lab_results_schedule'
        ) THEN
          ALTER TABLE "lab_results"
          ADD CONSTRAINT "FK_lab_results_schedule"
          FOREIGN KEY ("schedule_id") REFERENCES "exam_schedules"("id") ON DELETE SET NULL;
        END IF;
      END $$
    `);

    // 5. Indice somente se nao existir
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_lab_results_schedule_id" ON "lab_results" ("schedule_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lab_results_schedule_id"`);
    await queryRunner.query(`ALTER TABLE "lab_results" DROP CONSTRAINT IF EXISTS "FK_lab_results_schedule"`);
    await queryRunner.query(`ALTER TABLE "lab_results" DROP COLUMN IF EXISTS "schedule_id"`);
    await queryRunner.query(`ALTER TABLE "exam_schedules" DROP CONSTRAINT IF EXISTS "UQ_exam_schedules_name_trimester"`);
  }
}
