import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adiciona colunas de anexo (foto/PDF) para exames clínicos onde não há
 * JSONB hospedeiro disponível:
 *
 * - gynecology_consultations: pap smear (citopatológico) + mamografia
 * - menopause_assessments: DEXA (densitometria óssea)
 *
 * Cada anexo é armazenado como 3 colunas (url + name + mime_type) para
 * compatibilidade com o componente AttachmentField do frontend e o
 * padrão usado nos JSONBs (histeroscopias, semenAnalysis, hsg, etc.).
 */
export class AddClinicalAttachments1711900048000 implements MigrationInterface {
  name = 'AddClinicalAttachments1711900048000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "gynecology_consultations"
        ADD COLUMN "pap_smear_attachment_url" text,
        ADD COLUMN "pap_smear_attachment_name" text,
        ADD COLUMN "pap_smear_attachment_mime_type" text,
        ADD COLUMN "mammography_attachment_url" text,
        ADD COLUMN "mammography_attachment_name" text,
        ADD COLUMN "mammography_attachment_mime_type" text
    `);

    await queryRunner.query(`
      ALTER TABLE "menopause_assessments"
        ADD COLUMN "dexa_attachment_url" text,
        ADD COLUMN "dexa_attachment_name" text,
        ADD COLUMN "dexa_attachment_mime_type" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "menopause_assessments"
        DROP COLUMN "dexa_attachment_mime_type",
        DROP COLUMN "dexa_attachment_name",
        DROP COLUMN "dexa_attachment_url"
    `);

    await queryRunner.query(`
      ALTER TABLE "gynecology_consultations"
        DROP COLUMN "mammography_attachment_mime_type",
        DROP COLUMN "mammography_attachment_name",
        DROP COLUMN "mammography_attachment_url",
        DROP COLUMN "pap_smear_attachment_mime_type",
        DROP COLUMN "pap_smear_attachment_name",
        DROP COLUMN "pap_smear_attachment_url"
    `);
  }
}
