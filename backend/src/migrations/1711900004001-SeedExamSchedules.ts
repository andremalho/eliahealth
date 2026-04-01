import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedExamSchedules1711900004001 implements MigrationInterface {
  name = 'SeedExamSchedules1711900004001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Helper para insert seguro ──
    const esc = (v: string) => v.replace(/'/g, "''");
    const insertLab = (name: string, cat: string, ideal: number, min: number, max: number, tri: string, source: string) =>
      queryRunner.query(`
        INSERT INTO "exam_schedules"
          ("exam_name", "exam_category", "ga_weeks_ideal", "ga_weeks_min", "ga_weeks_max",
           "trimester", "is_routine", "source")
        VALUES ('${esc(name)}', '${esc(cat)}', ${ideal}, ${min}, ${max}, '${tri}', TRUE, '${esc(source)}')
      `);

    const insertUs = (
      name: string, cat: string, ideal: number, min: number, max: number,
      tri: string, routine: boolean, indication: string | null, notes: string | null, source: string,
    ) => {
      const ind = indication ? `'${esc(indication)}'` : 'NULL';
      const nt = notes ? `'${esc(notes)}'` : 'NULL';
      return queryRunner.query(`
        INSERT INTO "exam_schedules"
          ("exam_name", "exam_category", "ga_weeks_ideal", "ga_weeks_min", "ga_weeks_max",
           "trimester", "is_routine", "indication", "notes", "source")
        VALUES ('${esc(name)}', '${esc(cat)}', ${ideal}, ${min}, ${max},
                '${tri}', ${routine}, ${ind}, ${nt}, '${esc(source)}')
      `);
    };

    const src = 'FEBRASGO 2023 / MS Brasil';

    // ── 1º Trimestre ──
    await insertLab('Hemograma', 'hematology', 8, 6, 13, '1st', src);
    await insertLab('Tipagem sanguinea e Coombs indireto', 'hematology', 8, 6, 13, '1st', src);
    await insertLab('Glicemia de jejum', 'biochemistry', 8, 6, 13, '1st', src);
    await insertLab('VDRL', 'serology_infectious', 8, 6, 13, '1st', src);
    await insertLab('HIV', 'serology_infectious', 8, 6, 13, '1st', src);
    await insertLab('Toxoplasmose IgG/IgM', 'serology_torch', 8, 6, 13, '1st', src);
    await insertLab('Rubeola IgG', 'serology_torch', 8, 6, 13, '1st', src);
    await insertLab('Citomegalovirus IgG/IgM', 'serology_torch', 8, 6, 13, '1st', src);
    await insertLab('Hepatite B (HBsAg)', 'hepatitis', 8, 6, 13, '1st', src);
    await insertLab('Hepatite C (Anti-HCV)', 'hepatitis', 8, 6, 13, '1st', src);
    await insertLab('Urina tipo I (EAS)', 'urine', 8, 6, 13, '1st', src);
    await insertLab('Urocultura', 'urine', 8, 6, 13, '1st', src);
    await insertLab('TSH', 'hormones', 8, 6, 13, '1st', src);
    await insertLab('Vitamina D (25-OH)', 'vitamins', 8, 6, 13, '1st', src);

    // ── 2º Trimestre ──
    await insertLab('TOTG 75g', 'biochemistry', 26, 24, 28, '2nd', src);
    await insertLab('Hemograma', 'hematology', 24, 20, 28, '2nd', src);
    await insertLab('Urina tipo I (EAS)', 'urine', 24, 20, 28, '2nd', src);

    // ── 3º Trimestre ──
    await insertLab('Hemograma', 'hematology', 32, 28, 36, '3rd', src);
    await insertLab('VDRL', 'serology_infectious', 32, 28, 36, '3rd', src);
    await insertLab('Urina tipo I (EAS)', 'urine', 32, 28, 36, '3rd', src);
    await insertLab('Urocultura', 'urine', 32, 28, 36, '3rd', src);
    await insertLab('Streptococcus do grupo B (GBS)', 'microbiology', 36, 35, 37, '3rd', src);

    // ── Ultrassons obstétricos ──
    const usSrc = 'FEBRASGO 2023 / ISUOG';

    await insertUs('Ultrassom Obstétrico Inicial (Transvaginal)', 'imaging', 9, 6, 11, '1st', true, null,
      'Lei 14.598/2023 garante pelo menos dois ultrassons transvaginais nos primeiros 4 meses', usSrc);

    await insertUs('Ultrassom Transvaginal 2º Exame', 'imaging', 12, 8, 16, '1st', true,
      'obrigatório por lei (Lei 14.598/2023)', null, 'Lei 14.598/2023');

    await insertUs('Morfológico de 1º Trimestre com Doppler Colorido + Rastreamento de Pré-Eclâmpsia',
      'imaging', 12, 11, 14, '1st', true, null, null, usSrc);

    await insertUs('Morfológico de 2º Trimestre com Doppler Colorido + Ultrassom Transvaginal para Medida de Colo',
      'imaging', 22, 20, 24, '2nd', true, null, null, usSrc);

    await insertUs('Ecodoppler Fetal', 'imaging', 24, 18, 28, '2nd', true,
      'obrigatório por lei (Lei 14.598/2023) — avaliação cardíaca fetal para todas as gestantes',
      null, 'Lei 14.598/2023');

    await insertUs('Ultrassom Obstétrico com Doppler Colorido', 'imaging', 32, 28, 40, '3rd', false,
      'avaliação de crescimento e vitalidade fetal', null, usSrc);

    await insertUs('Perfil Biofísico Fetal + Ultrassom Obstétrico com Doppler Colorido',
      'imaging', 36, 32, 40, '3rd', false,
      'pacientes diabéticas ou suspeita de comprometimento de vitalidade fetal', null, usSrc);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "exam_schedules" WHERE "source" IN ('FEBRASGO 2023 / MS Brasil', 'FEBRASGO 2023 / ISUOG', 'Lei 14.598/2023')`);
  }
}
