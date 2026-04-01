import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedOnDemandExams1711900010001 implements MigrationInterface {
  name = 'SeedOnDemandExams1711900010001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const src = 'FEBRASGO 2023 / ACOG';
    const esc = (v: string) => v.replace(/'/g, "''");

    const exams: { name: string; cat: string; indication: string }[] = [
      { name: 'TGO (AST)', cat: 'biochemistry', indication: 'suspeita de pré-eclâmpsia/HELLP' },
      { name: 'TGP (ALT)', cat: 'biochemistry', indication: 'suspeita de pré-eclâmpsia/HELLP' },
      { name: 'DHL', cat: 'biochemistry', indication: 'suspeita de hemólise/HELLP' },
      { name: 'Bilirrubina Total e Frações', cat: 'biochemistry', indication: 'suspeita de hemólise/HELLP' },
      { name: 'Ácido Úrico', cat: 'biochemistry', indication: 'rastreamento pré-eclâmpsia' },
      { name: 'Proteinúria 24h', cat: 'biochemistry', indication: 'suspeita de pré-eclâmpsia' },
      { name: 'Relação Proteína/Creatinina', cat: 'biochemistry', indication: 'alternativa à proteinúria 24h' },
      { name: 'Esquizócitos (esfregaço)', cat: 'hematology', indication: 'suspeita de microangiopatia/HELLP' },
    ];

    for (const e of exams) {
      await queryRunner.query(`
        INSERT INTO "exam_schedules"
          ("exam_name", "exam_category", "ga_weeks_ideal", "ga_weeks_min", "ga_weeks_max",
           "trimester", "is_routine", "indication", "source")
        SELECT '${esc(e.name)}', '${esc(e.cat)}', 0, 0, 42,
               'all', FALSE, '${esc(e.indication)}', '${esc(src)}'
        WHERE NOT EXISTS (
          SELECT 1 FROM "exam_schedules" WHERE "exam_name" = '${esc(e.name)}' AND "trimester" = 'all'
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "exam_schedules"
      WHERE "is_routine" = FALSE
        AND "source" = 'FEBRASGO 2023 / ACOG'
        AND "trimester" = 'all'
    `);
  }
}
