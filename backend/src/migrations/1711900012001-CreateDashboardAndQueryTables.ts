import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDashboardAndQueryTables1711900012001 implements MigrationInterface {
  name = 'CreateDashboardAndQueryTables1711900012001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "widget_type_enum" AS ENUM ('pie','bar','line','scatter','number','table')`);
    await queryRunner.query(`CREATE TYPE "dashboard_metric_enum" AS ENUM ('risk_distribution','preeclampsia_rate','gestational_diabetes_rate','pregestational_diabetes_rate','fgr_rate','preterm_birth_rate','thrombophilia_rate','hellp_rate','cesarean_rate','trisomy_screening_risk','maternal_age_distribution','bmi_distribution','delivery_type_distribution','regional_distribution','active_vs_completed','high_vs_low_risk')`);
    await queryRunner.query(`CREATE TYPE "widget_width_enum" AS ENUM ('half','full')`);
    await queryRunner.query(`CREATE TYPE "query_status_enum" AS ENUM ('pending','processing','completed','error')`);

    await queryRunner.query(`
      CREATE TABLE "research_dashboards" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"     uuid NOT NULL,
        "name"        character varying NOT NULL,
        "is_default"  boolean NOT NULL DEFAULT false,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_research_dashboards" PRIMARY KEY ("id"),
        CONSTRAINT "FK_research_dashboards_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_research_dashboards_user_id" ON "research_dashboards" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE "dashboard_widgets" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dashboard_id"  uuid NOT NULL,
        "widget_type"   "widget_type_enum" NOT NULL,
        "title"         character varying NOT NULL,
        "metric"        "dashboard_metric_enum" NOT NULL,
        "filters"       jsonb,
        "chart_config"  jsonb,
        "position"      integer NOT NULL DEFAULT 0,
        "width"         "widget_width_enum" NOT NULL DEFAULT 'half',
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dashboard_widgets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_dashboard_widgets_dashboard" FOREIGN KEY ("dashboard_id") REFERENCES "research_dashboards"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_dashboard_widgets_dashboard_id" ON "dashboard_widgets" ("dashboard_id")`);

    await queryRunner.query(`
      CREATE TABLE "research_queries" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"           uuid NOT NULL,
        "question"          text NOT NULL,
        "sql_generated"     text,
        "result"            jsonb,
        "chart_type"        character varying,
        "status"            "query_status_enum" NOT NULL DEFAULT 'pending',
        "execution_time_ms" integer,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_research_queries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_research_queries_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_research_queries_user_id" ON "research_queries" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "research_queries"`);
    await queryRunner.query(`DROP TABLE "dashboard_widgets"`);
    await queryRunner.query(`DROP TABLE "research_dashboards"`);
    await queryRunner.query(`DROP TYPE "query_status_enum"`);
    await queryRunner.query(`DROP TYPE "widget_width_enum"`);
    await queryRunner.query(`DROP TYPE "dashboard_metric_enum"`);
    await queryRunner.query(`DROP TYPE "widget_type_enum"`);
  }
}
