import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTranslations1711900015001 implements MigrationInterface {
  name = 'SeedTranslations1711900015001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const esc = (s: string) => s.replace(/'/g, "''");
    const ins = (key: string, lang: string, value: string, cat: string) =>
      queryRunner.query(`
        INSERT INTO "translations" ("key", "language", "value", "category")
        SELECT '${esc(key)}', '${lang}', '${esc(value)}', '${cat}'
        WHERE NOT EXISTS (SELECT 1 FROM "translations" WHERE "key" = '${esc(key)}' AND "language" = '${lang}')
      `);

    // ── Alertas clínicos ──
    await ins('alert.hellp.tgo_elevated', 'pt_BR', 'TGO elevada — investigar HELLP síndrome', 'alerts');
    await ins('alert.hellp.tgo_elevated', 'en_US', 'Elevated AST — investigate HELLP syndrome', 'alerts');
    await ins('alert.hellp.tgo_elevated', 'es_ES', 'TGO elevada — investigar síndrome HELLP', 'alerts');

    await ins('alert.hellp.critical', 'pt_BR', 'CRÍTICO: HELLP síndrome provável', 'alerts');
    await ins('alert.hellp.critical', 'en_US', 'CRITICAL: Probable HELLP syndrome', 'alerts');
    await ins('alert.hellp.critical', 'es_ES', 'CRÍTICO: Síndrome HELLP probable', 'alerts');

    await ins('alert.bp.critical', 'pt_BR', 'CRÍTICO: Hipertensão grave — risco de eclâmpsia', 'alerts');
    await ins('alert.bp.critical', 'en_US', 'CRITICAL: Severe hypertension — eclampsia risk', 'alerts');
    await ins('alert.bp.critical', 'es_ES', 'CRÍTICO: Hipertensión grave — riesgo de eclampsia', 'alerts');

    await ins('alert.bp.elevated', 'pt_BR', 'PA elevada — monitorar de perto', 'alerts');
    await ins('alert.bp.elevated', 'en_US', 'Elevated BP — close monitoring required', 'alerts');
    await ins('alert.bp.elevated', 'es_ES', 'PA elevada — monitorear de cerca', 'alerts');

    await ins('alert.glucose.hypoglycemia', 'pt_BR', 'Hipoglicemia grave — tratamento imediato', 'alerts');
    await ins('alert.glucose.hypoglycemia', 'en_US', 'Severe hypoglycemia — immediate treatment', 'alerts');
    await ins('alert.glucose.hypoglycemia', 'es_ES', 'Hipoglucemia grave — tratamiento inmediato', 'alerts');

    await ins('alert.glucose.hyperglycemia', 'pt_BR', 'Hiperglicemia grave — avalie cetoacidose', 'alerts');
    await ins('alert.glucose.hyperglycemia', 'en_US', 'Severe hyperglycemia — evaluate ketoacidosis', 'alerts');
    await ins('alert.glucose.hyperglycemia', 'es_ES', 'Hiperglucemia grave — evalúe cetoacidosis', 'alerts');

    await ins('alert.gbs.positive', 'pt_BR', 'GBS positivo — profilaxia intraparto obrigatória', 'alerts');
    await ins('alert.gbs.positive', 'en_US', 'GBS positive — intrapartum prophylaxis required', 'alerts');
    await ins('alert.gbs.positive', 'es_ES', 'GBS positivo — profilaxis intraparto obligatoria', 'alerts');

    // ── Labels clínicos ──
    await ins('field.bp_systolic', 'pt_BR', 'PA Sistólica', 'clinical');
    await ins('field.bp_systolic', 'en_US', 'Systolic BP', 'clinical');
    await ins('field.bp_systolic', 'es_ES', 'PA Sistólica', 'clinical');

    await ins('field.bp_diastolic', 'pt_BR', 'PA Diastólica', 'clinical');
    await ins('field.bp_diastolic', 'en_US', 'Diastolic BP', 'clinical');
    await ins('field.bp_diastolic', 'es_ES', 'PA Diastólica', 'clinical');

    await ins('field.fundal_height', 'pt_BR', 'Altura Uterina', 'clinical');
    await ins('field.fundal_height', 'en_US', 'Fundal Height', 'clinical');
    await ins('field.fundal_height', 'es_ES', 'Altura Uterina', 'clinical');

    await ins('field.fetal_heart_rate', 'pt_BR', 'BCF', 'clinical');
    await ins('field.fetal_heart_rate', 'en_US', 'FHR', 'clinical');
    await ins('field.fetal_heart_rate', 'es_ES', 'FCF', 'clinical');

    await ins('field.gestational_age', 'pt_BR', 'Idade Gestacional', 'clinical');
    await ins('field.gestational_age', 'en_US', 'Gestational Age', 'clinical');
    await ins('field.gestational_age', 'es_ES', 'Edad Gestacional', 'clinical');

    await ins('field.edd', 'pt_BR', 'Data Provável do Parto', 'clinical');
    await ins('field.edd', 'en_US', 'Estimated Due Date', 'clinical');
    await ins('field.edd', 'es_ES', 'Fecha Probable de Parto', 'clinical');

    // ── Erros da API ──
    await ins('error.not_found', 'pt_BR', 'Recurso não encontrado', 'errors');
    await ins('error.not_found', 'en_US', 'Resource not found', 'errors');
    await ins('error.not_found', 'es_ES', 'Recurso no encontrado', 'errors');

    await ins('error.unauthorized', 'pt_BR', 'Credenciais inválidas', 'errors');
    await ins('error.unauthorized', 'en_US', 'Invalid credentials', 'errors');
    await ins('error.unauthorized', 'es_ES', 'Credenciales inválidas', 'errors');

    await ins('error.forbidden', 'pt_BR', 'Acesso negado', 'errors');
    await ins('error.forbidden', 'en_US', 'Access denied', 'errors');
    await ins('error.forbidden', 'es_ES', 'Acceso denegado', 'errors');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "translations"`);
  }
}
