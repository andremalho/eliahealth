import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantConfig1711900059000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "tenant_type_enum" AS ENUM ('consultorio','ubs','hospital')`);

    await queryRunner.query(`
      CREATE TABLE "tenant_configs" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id" uuid UNIQUE,
        "name" varchar NOT NULL,
        "type" "tenant_type_enum" NOT NULL DEFAULT 'consultorio',
        "logo_url" varchar,
        "mod_prenatal" boolean DEFAULT true,
        "mod_gynecology" boolean DEFAULT true,
        "mod_ultrasound" boolean DEFAULT true,
        "mod_postpartum" boolean DEFAULT true,
        "mod_infertility" boolean DEFAULT false,
        "mod_assisted_reproduction" boolean DEFAULT false,
        "mod_menopause" boolean DEFAULT false,
        "mod_clinical_general" boolean DEFAULT false,
        "mod_hospitalization" boolean DEFAULT false,
        "mod_evolution" boolean DEFAULT false,
        "mod_portal" boolean DEFAULT true,
        "mod_scheduling" boolean DEFAULT true,
        "mod_research" boolean DEFAULT false,
        "mod_telemedicine" boolean DEFAULT false,
        "mod_tiss_billing" boolean DEFAULT false,
        "mod_fhir_rnds" boolean DEFAULT false,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_configs"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tenant_type_enum"`);
  }
}
