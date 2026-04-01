import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePregnancies1711900001000 implements MigrationInterface {
  name = 'CreatePregnancies1711900001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "ga_method_enum" AS ENUM ('lmp', 'ultrasound', 'ivf')
    `);

    await queryRunner.query(`
      CREATE TYPE "chorionicity_enum" AS ENUM ('na', 'dc', 'mc', 'mcda', 'mcma')
    `);

    await queryRunner.query(`
      CREATE TYPE "pregnancy_status_enum" AS ENUM ('active', 'completed', 'interrupted')
    `);

    await queryRunner.query(`
      CREATE TABLE "pregnancies" (
        "id"                 uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id"         uuid NOT NULL,
        "lmp_date"           date NOT NULL,
        "us_dating_date"     date,
        "us_dating_ga_days"  integer,
        "edd"                date NOT NULL,
        "ga_method"          "ga_method_enum" NOT NULL,
        "gravida"            integer NOT NULL,
        "para"               integer NOT NULL,
        "abortus"            integer NOT NULL,
        "plurality"          integer NOT NULL DEFAULT 1,
        "chorionicity"       "chorionicity_enum",
        "status"             "pregnancy_status_enum" NOT NULL DEFAULT 'active',
        "high_risk_flags"    jsonb NOT NULL DEFAULT '[]',
        "created_at"         TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pregnancies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pregnancies_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_pregnancies_patient_id" ON "pregnancies" ("patient_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pregnancies"`);
    await queryRunner.query(`DROP TYPE "pregnancy_status_enum"`);
    await queryRunner.query(`DROP TYPE "chorionicity_enum"`);
    await queryRunner.query(`DROP TYPE "ga_method_enum"`);
  }
}
