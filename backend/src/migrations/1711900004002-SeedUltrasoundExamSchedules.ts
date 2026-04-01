import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedUltrasoundExamSchedules1711900004002 implements MigrationInterface {
  name = 'SeedUltrasoundExamSchedules1711900004002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const src = 'FEBRASGO 2023 / ISUOG';

    const exams: {
      name: string; cat: string; ideal: number; min: number; max: number;
      tri: string; routine: boolean; indication: string | null; notes: string | null; src: string;
    }[] = [
      {
        name: 'Ultrassom Obstétrico Inicial (Transvaginal)',
        cat: 'imaging', ideal: 9, min: 6, max: 11, tri: '1st',
        routine: true, indication: null,
        notes: 'Lei 14.598/2023 garante pelo menos dois ultrassons transvaginais nos primeiros 4 meses',
        src,
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
        routine: true, indication: null, notes: null, src,
      },
      {
        name: 'Morfológico de 2º Trimestre com Doppler Colorido + Ultrassom Transvaginal para Medida de Colo',
        cat: 'imaging', ideal: 22, min: 20, max: 24, tri: '2nd',
        routine: true, indication: null, notes: null, src,
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
        notes: null, src,
      },
      {
        name: 'Perfil Biofísico Fetal + Ultrassom Obstétrico com Doppler Colorido',
        cat: 'imaging', ideal: 36, min: 32, max: 40, tri: '3rd',
        routine: false,
        indication: 'pacientes diabéticas ou suspeita de comprometimento de vitalidade fetal',
        notes: null, src,
      },
    ];

    for (const e of exams) {
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
      `DELETE FROM "exam_schedules" WHERE "source" = 'FEBRASGO 2023 / ISUOG'`,
    );
  }
}
