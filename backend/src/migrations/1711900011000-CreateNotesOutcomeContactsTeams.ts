import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotesOutcomeContactsTeams1711900011000 implements MigrationInterface {
  name = 'CreateNotesOutcomeContactsTeams1711900011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── notes ──
    await queryRunner.query(`CREATE TYPE "note_type_enum" AS ENUM ('postit','annotation','reminder')`);
    await queryRunner.query(`
      CREATE TABLE "notes" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"  uuid NOT NULL,
        "author_id"     uuid NOT NULL,
        "type"          "note_type_enum" NOT NULL DEFAULT 'postit',
        "content"       text NOT NULL,
        "color"         character varying,
        "is_pinned"     boolean NOT NULL DEFAULT false,
        "is_private"    boolean NOT NULL DEFAULT true,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notes_pregnancy" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notes_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notes_pregnancy_id" ON "notes" ("pregnancy_id")`);

    // ── pregnancy_outcomes ──
    await queryRunner.query(`CREATE TYPE "delivery_type_enum" AS ENUM ('vaginal','cesarean','forceps','vacuum')`);
    await queryRunner.query(`
      CREATE TABLE "pregnancy_outcomes" (
        "id"                            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"                  uuid NOT NULL,
        "delivery_date"                 date NOT NULL,
        "delivery_type"                 "delivery_type_enum" NOT NULL,
        "delivery_indication"           character varying,
        "gestational_age_at_delivery"   integer NOT NULL,
        "hospital_name"                 character varying,
        "neonatal_data"                 jsonb NOT NULL DEFAULT '[]',
        "maternal_complications"        jsonb,
        "maternal_complications_notes"  text,
        "blood_loss_estimated"          integer,
        "placenta_weight"               integer,
        "notes"                         text,
        "created_at"                    TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pregnancy_outcomes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pregnancy_outcomes_pregnancy" UNIQUE ("pregnancy_id"),
        CONSTRAINT "FK_pregnancy_outcomes_pregnancy" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancies"("id") ON DELETE CASCADE
      )
    `);

    // ── emergency_contacts ──
    await queryRunner.query(`CREATE TYPE "relationship_enum" AS ENUM ('spouse','parent','sibling','friend','other')`);
    await queryRunner.query(`
      CREATE TABLE "emergency_contacts" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id"      uuid NOT NULL,
        "name"            character varying NOT NULL,
        "relationship"    "relationship_enum" NOT NULL,
        "phone"           character varying NOT NULL,
        "phone2"          character varying,
        "is_main_contact" boolean NOT NULL DEFAULT false,
        "notes"           character varying,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_emergency_contacts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_emergency_contacts_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_emergency_contacts_patient_id" ON "emergency_contacts" ("patient_id")`);

    // ── team_members ──
    await queryRunner.query(`CREATE TYPE "team_role_enum" AS ENUM ('viewer','editor','admin')`);
    await queryRunner.query(`
      CREATE TABLE "team_members" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "owner_id"    uuid NOT NULL,
        "member_id"   uuid NOT NULL,
        "role"        "team_role_enum" NOT NULL,
        "specialty"   character varying,
        "is_active"   boolean NOT NULL DEFAULT true,
        "invited_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "accepted_at" TIMESTAMP WITH TIME ZONE,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_team_members" PRIMARY KEY ("id"),
        CONSTRAINT "FK_team_members_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_team_members_member" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_team_members_owner_id" ON "team_members" ("owner_id")`);

    // ── pregnancy_shares ──
    await queryRunner.query(`CREATE TYPE "share_permission_enum" AS ENUM ('view','edit')`);
    await queryRunner.query(`
      CREATE TABLE "pregnancy_shares" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pregnancy_id"  uuid NOT NULL,
        "shared_by"     uuid NOT NULL,
        "shared_with"   uuid NOT NULL,
        "permission"    "share_permission_enum" NOT NULL,
        "expires_at"    TIMESTAMP WITH TIME ZONE,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pregnancy_shares" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pregnancy_shares_pregnancy" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pregnancy_shares_by" FOREIGN KEY ("shared_by") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pregnancy_shares_with" FOREIGN KEY ("shared_with") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_pregnancy_shares_pregnancy_id" ON "pregnancy_shares" ("pregnancy_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pregnancy_shares"`);
    await queryRunner.query(`DROP TYPE "share_permission_enum"`);
    await queryRunner.query(`DROP TABLE "team_members"`);
    await queryRunner.query(`DROP TYPE "team_role_enum"`);
    await queryRunner.query(`DROP TABLE "emergency_contacts"`);
    await queryRunner.query(`DROP TYPE "relationship_enum"`);
    await queryRunner.query(`DROP TABLE "pregnancy_outcomes"`);
    await queryRunner.query(`DROP TYPE "delivery_type_enum"`);
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(`DROP TYPE "note_type_enum"`);
  }
}
