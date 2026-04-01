import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedHadlockEFW1711900007002 implements MigrationInterface {
  name = 'SeedHadlockEFW1711900007002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const src = 'Hadlock FP et al. Radiology 1984; 150:535-540';
    const name = 'Hadlock 1984';

    // Hadlock EFW percentiles (p10, p50, p90) in grams by gestational week
    // Data derived from Hadlock regression formulas
    const data: [number, number, number, number, number, number, number, number][] = [
      // [week, p5, p10, p25, p50, p75, p90, p95] — approximate values
      //  week, p5,   p10,  p50,  p90,  p95
      // Using simplified [week, p10, p50, p90] with calculated p5/p25/p75/p95
      // [gaWeeks, p5, p10, p25, p50, p75, p90, p95]
      [14, 60, 70, 80, 93, 106, 116, 126],
      [15, 80, 93, 107, 117, 127, 141, 154],
      [16, 105, 121, 138, 146, 154, 171, 187],
      [17, 136, 150, 168, 181, 194, 212, 226],
      [18, 167, 185, 207, 223, 239, 261, 279],
      [19, 205, 227, 254, 275, 296, 323, 345],
      [20, 248, 275, 309, 331, 353, 387, 414],
      [21, 299, 331, 370, 399, 428, 467, 499],
      [22, 359, 398, 443, 478, 513, 558, 597],
      [23, 426, 471, 526, 568, 610, 665, 710],
      [24, 503, 556, 619, 670, 721, 784, 837],
      [25, 589, 652, 726, 785, 844, 918, 981],
      [26, 685, 758, 844, 913, 982, 1068, 1141],
      [27, 791, 876, 975, 1055, 1135, 1234, 1319],
      [28, 908, 1004, 1118, 1210, 1302, 1416, 1512],
      [29, 1034, 1145, 1274, 1379, 1484, 1613, 1724],
      [30, 1169, 1294, 1441, 1559, 1677, 1824, 1949],
      [31, 1313, 1453, 1617, 1751, 1885, 2049, 2189],
      [32, 1465, 1621, 1805, 1953, 2101, 2285, 2441],
      [33, 1622, 1794, 1998, 2162, 2326, 2530, 2702],
      [34, 1783, 1973, 2197, 2377, 2557, 2781, 2971],
      [35, 1946, 2154, 2398, 2595, 2792, 3036, 3244],
      [36, 2110, 2335, 2600, 2813, 3026, 3291, 3516],
      [37, 2271, 2513, 2798, 3028, 3258, 3543, 3785],
      [38, 2427, 2686, 2990, 3236, 3482, 3786, 4045],
      [39, 2576, 2851, 3174, 3435, 3696, 4019, 4294],
      [40, 2714, 3004, 3345, 3619, 3893, 4234, 4524],
    ];

    for (const [week, p5, p10, p25, p50, p75, p90, p95] of data) {
      await queryRunner.query(`
        INSERT INTO "biometry_reference_tables"
          ("table_name", "parameter", "gestational_age_weeks",
           "p5", "p10", "p25", "p50", "p75", "p90", "p95",
           "unit", "source", "is_default")
        VALUES ('${name}', 'efw', ${week},
                ${p5}, ${p10}, ${p25}, ${p50}, ${p75}, ${p90}, ${p95},
                'g', '${src}', TRUE)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "biometry_reference_tables"
      WHERE "table_name" = 'Hadlock 1984' AND "parameter" = 'efw'
    `);
  }
}
