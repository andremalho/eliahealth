import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedExamSchedules1711900004001 implements MigrationInterface {
  name = 'SeedExamSchedules1711900004001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fonte: FEBRASGO 2023 / Ministério da Saúde — Caderneta da Gestante
    const src = 'FEBRASGO 2023 / MS Brasil';

    const exams = [
      // ── 1º Trimestre ──
      { name: 'Hemograma', cat: 'hematology', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'Tipagem sanguinea e Coombs indireto', cat: 'hematology', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'Glicemia de jejum', cat: 'biochemistry', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'VDRL', cat: 'serology_infectious', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'HIV', cat: 'serology_infectious', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'Toxoplasmose IgG/IgM', cat: 'serology_torch', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'Rubeola IgG', cat: 'serology_torch', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'Citomegalovirus IgG/IgM', cat: 'serology_torch', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'Hepatite B (HBsAg)', cat: 'hepatitis', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'Hepatite C (Anti-HCV)', cat: 'hepatitis', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'Urina tipo I (EAS)', cat: 'urine', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'Urocultura', cat: 'urine', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'TSH', cat: 'hormones', ideal: 8, min: 6, max: 13, tri: '1st', src },
      { name: 'Vitamina D (25-OH)', cat: 'vitamins', ideal: 8, min: 6, max: 13, tri: '1st', src },

      // ── 2º Trimestre ──
      { name: 'TOTG 75g', cat: 'biochemistry', ideal: 26, min: 24, max: 28, tri: '2nd', src },
      { name: 'Hemograma', cat: 'hematology', ideal: 24, min: 20, max: 28, tri: '2nd', src },
      { name: 'Urina tipo I (EAS)', cat: 'urine', ideal: 24, min: 20, max: 28, tri: '2nd', src },

      // ── 3º Trimestre ──
      { name: 'Hemograma', cat: 'hematology', ideal: 32, min: 28, max: 36, tri: '3rd', src },
      { name: 'VDRL', cat: 'serology_infectious', ideal: 32, min: 28, max: 36, tri: '3rd', src },
      { name: 'Urina tipo I (EAS)', cat: 'urine', ideal: 32, min: 28, max: 36, tri: '3rd', src },
      { name: 'Urocultura', cat: 'urine', ideal: 32, min: 28, max: 36, tri: '3rd', src },
      { name: 'Streptococcus do grupo B (GBS)', cat: 'microbiology', ideal: 36, min: 35, max: 37, tri: '3rd', src },
    ];

    for (const e of exams) {
      await queryRunner.query(
        `INSERT INTO "exam_schedules"
          ("exam_name", "exam_category", "ga_weeks_ideal", "ga_weeks_min", "ga_weeks_max",
           "trimester", "is_routine", "source")
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
        [e.name, e.cat, e.ideal, e.min, e.max, e.tri, e.src],
      );
    }

    // ── Ultrassons obstétricos (FEBRASGO 2023 / ISUOG) ──
    const usSrc = 'FEBRASGO 2023 / ISUOG';

    const usExams: {
      name: string; cat: string; ideal: number; min: number; max: number;
      tri: string; routine: boolean; indication: string | null; notes: string | null; src: string;
    }[] = [
      {
        name: 'Ultrassom Obstétrico Inicial (Transvaginal)',
        cat: 'imaging', ideal: 9, min: 6, max: 11, tri: '1st',
        routine: true, indication: null,
        notes: 'Lei 14.598/2023 garante pelo menos dois ultrassons transvaginais nos primeiros 4 meses',
        src: usSrc,
      },
      {
        name: 'Ultrassom Transvaginal 2º Exame',
        cat: 'imaging', ideal: 12, min: 8, max: 16, tri: '1st',
        routine: true, indication: 'obrigatório por lei (Lei 14.598/2023)',
        notes: null, src: 'Lei 14.598/2023',
      },
      {
        name: 'Morfológico de 1º Trimestre com Doppler Colorido + Rastreamento de Pré-Eclâmpsia',
        cat: 'imaging', ideal: 12, min: 11, max: 14, tri: '1st',
        routine: true, indication: null, notes: null, src: usSrc,
      },
      {
        name: 'Morfológico de 2º Trimestre com Doppler Colorido + Ultrassom Transvaginal para Medida de Colo',
        cat: 'imaging', ideal: 22, min: 20, max: 24, tri: '2nd',
        routine: true, indication: null, notes: null, src: usSrc,
      },
      {
        name: 'Ecodoppler Fetal',
        cat: 'imaging', ideal: 24, min: 18, max: 28, tri: '2nd',
        routine: true,
        indication: 'obrigatório por lei (Lei 14.598/2023) — avaliação cardíaca fetal para todas as gestantes',
        notes: null, src: 'Lei 14.598/2023',
      },
      {
        name: 'Ultrassom Obstétrico com Doppler Colorido',
        cat: 'imaging', ideal: 32, min: 28, max: 40, tri: '3rd',
        routine: false, indication: 'avaliação de crescimento e vitalidade fetal',
        notes: null, src: usSrc,
      },
      {
        name: 'Perfil Biofísico Fetal + Ultrassom Obstétrico com Doppler Colorido',
        cat: 'imaging', ideal: 36, min: 32, max: 40, tri: '3rd',
        routine: false,
        indication: 'pacientes diabéticas ou suspeita de comprometimento de vitalidade fetal',
        notes: null, src: usSrc,
      },
    ];

    for (const e of usExams) {
      await queryRunner.query(
        `INSERT INTO "exam_schedules"
          ("exam_name", "exam_category", "ga_weeks_ideal", "ga_weeks_min", "ga_weeks_max",
           "trimester", "is_routine", "indication", "notes", "source")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [e.name, e.cat, e.ideal, e.min, e.max, e.tri, e.routine, e.indication, e.notes, e.src],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "exam_schedules" WHERE "source" = 'FEBRASGO 2023 / MS Brasil'`,
    );
  }
}
