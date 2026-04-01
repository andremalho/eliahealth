import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedUltrasoundExamSchedules1711900004002 implements MigrationInterface {
  name = 'SeedUltrasoundExamSchedules1711900004002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const insert = (
      name: string, cat: string, ideal: number, min: number, max: number,
      tri: string, routine: boolean, indication: string | null, notes: string | null, source: string,
    ) => {
      const esc = (v: string) => v.replace(/'/g, "''");
      const ind = indication ? `'${esc(indication)}'` : 'NULL';
      const nt = notes ? `'${esc(notes)}'` : 'NULL';
      return queryRunner.query(`
        INSERT INTO "exam_schedules"
          ("exam_name", "exam_category", "ga_weeks_ideal", "ga_weeks_min", "ga_weeks_max",
           "trimester", "is_routine", "indication", "notes", "source")
        SELECT '${esc(name)}', '${esc(cat)}', ${ideal}, ${min}, ${max},
               '${tri}', ${routine}, ${ind}, ${nt}, '${esc(source)}'
        WHERE NOT EXISTS (
          SELECT 1 FROM "exam_schedules" WHERE "exam_name" = '${esc(name)}' AND "trimester" = '${tri}'
        )
      `);
    };

    const src = 'FEBRASGO 2023 / ISUOG';

    await insert('Ultrassom Obstétrico Inicial (Transvaginal)', 'imaging', 9, 6, 11, '1st', true, null,
      'Lei 14.598/2023 garante pelo menos dois ultrassons transvaginais nos primeiros 4 meses', src);

    await insert('Ultrassom Transvaginal 2º Exame', 'imaging', 12, 8, 16, '1st', true,
      'obrigatório por lei (Lei 14.598/2023)', null, 'Lei 14.598/2023');

    await insert('Morfológico de 1º Trimestre com Doppler Colorido + Rastreamento de Pré-Eclâmpsia',
      'imaging', 12, 11, 14, '1st', true, null, null, src);

    await insert('Morfológico de 2º Trimestre com Doppler Colorido + Ultrassom Transvaginal para Medida de Colo',
      'imaging', 22, 20, 24, '2nd', true, null, null, src);

    await insert('Ecodoppler Fetal', 'imaging', 24, 18, 28, '2nd', true,
      'obrigatório por lei (Lei 14.598/2023) — avaliação cardíaca fetal para todas as gestantes',
      null, 'Lei 14.598/2023');

    await insert('Ultrassom Obstétrico com Doppler Colorido', 'imaging', 32, 28, 40, '3rd', false,
      'avaliação de crescimento e vitalidade fetal', null, src);

    await insert('Perfil Biofísico Fetal + Ultrassom Obstétrico com Doppler Colorido',
      'imaging', 36, 32, 40, '3rd', false,
      'pacientes diabéticas ou suspeita de comprometimento de vitalidade fetal', null, src);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "exam_schedules" WHERE "source" IN ('FEBRASGO 2023 / ISUOG', 'Lei 14.598/2023')`,
    );
  }
}
