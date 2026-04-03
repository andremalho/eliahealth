import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVsrVaccine1711900014002 implements MigrationInterface {
  name = 'AddVsrVaccine1711900014002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar 'vsr' ao enum vaccine_type_enum
    await queryRunner.query(`ALTER TYPE "vaccine_type_enum" ADD VALUE IF NOT EXISTS 'vsr'`);

    // Seed no ExamSchedule
    await queryRunner.query(`
      INSERT INTO "exam_schedules"
        ("exam_name", "exam_category", "ga_weeks_ideal", "ga_weeks_min", "ga_weeks_max",
         "trimester", "is_routine", "indication", "notes", "source")
      SELECT
        'VSR (Vírus Sincicial Respiratório) — Abrysvo®', 'vaccine', 32, 28, 40,
        '3rd', TRUE,
        'Obrigatória pelo SUS — dose única a cada gestação a partir da 28ª semana. Protege o recém-nascido contra bronquiolite por VSR nos primeiros 6 meses de vida (eficácia 81,8% nos primeiros 90 dias).',
        'Pode ser administrada simultaneamente com influenza, COVID-19 e dTpa. Vacina recombinante bivalente (subgrupos A e B), sem adjuvantes. Incorporada ao SUS em dezembro/2025.',
        'MS Brasil / SBIm / FEBRASGO 2025 — Calendário Nacional de Vacinação'
      WHERE NOT EXISTS (
        SELECT 1 FROM "exam_schedules"
        WHERE "exam_name" = 'VSR (Vírus Sincicial Respiratório) — Abrysvo®' AND "trimester" = '3rd'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "exam_schedules"
      WHERE "exam_name" = 'VSR (Vírus Sincicial Respiratório) — Abrysvo®'
    `);
  }
}
