import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedGestationalVaccineSchedule1711900014001 implements MigrationInterface {
  name = 'SeedGestationalVaccineSchedule1711900014001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const src = 'MS Brasil / FEBRASGO 2023';

    // Adicionar vacinas ao ExamSchedule como referência
    const vaccines = [
      { name: 'Influenza (dose única)', cat: 'vaccine', ideal: 17, min: 14, max: 20, tri: '2nd', indication: 'dose única para todas as gestantes' },
      { name: 'dTpa/Tdap (dose única)', cat: 'vaccine', ideal: 32, min: 27, max: 36, tri: '3rd', indication: 'dose única entre 27-36 semanas, idealmente 32 semanas' },
      { name: 'Hepatite B (1ª dose)', cat: 'vaccine', ideal: 8, min: 6, max: 13, tri: '1st', indication: 'se não imunizada — 3 doses (0, 1 e 6 meses)' },
      { name: 'Hepatite B (2ª dose)', cat: 'vaccine', ideal: 12, min: 10, max: 17, tri: '1st', indication: 'se não imunizada — 1 mês após 1ª dose' },
      { name: 'Hepatite B (3ª dose)', cat: 'vaccine', ideal: 32, min: 30, max: 40, tri: '3rd', indication: 'se não imunizada — 6 meses após 1ª dose' },
    ];

    for (const v of vaccines) {
      const esc = (s: string) => s.replace(/'/g, "''");
      await queryRunner.query(`
        INSERT INTO "exam_schedules"
          ("exam_name", "exam_category", "ga_weeks_ideal", "ga_weeks_min", "ga_weeks_max",
           "trimester", "is_routine", "indication", "source")
        SELECT '${esc(v.name)}', '${esc(v.cat)}', ${v.ideal}, ${v.min}, ${v.max},
               '${v.tri}', TRUE, '${esc(v.indication)}', '${esc(src)}'
        WHERE NOT EXISTS (
          SELECT 1 FROM "exam_schedules" WHERE "exam_name" = '${esc(v.name)}' AND "trimester" = '${v.tri}'
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "exam_schedules" WHERE "exam_category" = 'vaccine' AND "source" = 'MS Brasil / FEBRASGO 2023'`);
  }
}
