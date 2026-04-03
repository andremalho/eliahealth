import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUltrasoundDicomSupport1711900027000
  implements MigrationInterface
{
  name = 'AddUltrasoundDicomSupport1711900027000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'dicom' to attachment type enum
    await queryRunner.query(`
      ALTER TYPE "summary_attachment_type_enum"
      ADD VALUE IF NOT EXISTS 'dicom'
    `);

    // Add DICOM study UID column
    await queryRunner.query(`
      ALTER TABLE "ultrasound_summaries"
        ADD COLUMN "dicom_study_uid" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ultrasound_summaries"
        DROP COLUMN "dicom_study_uid"
    `);
  }
}
