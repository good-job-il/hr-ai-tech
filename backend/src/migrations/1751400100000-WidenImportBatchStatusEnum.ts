import { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Follow-up to WidenEnumsForBase44Migration — Base44's live data also has an
 * `in_progress` status value for CandidateImportBatch that isn't in the
 * original ENUM definition.
 */
export class WidenImportBatchStatusEnum1751400100000 implements MigrationInterface {
  name = "WidenImportBatchStatusEnum1751400100000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`candidate_import_batches\`
      MODIFY COLUMN \`status\` ENUM('pending','processing','in_progress','completed','failed','partial') NOT NULL DEFAULT 'pending';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`candidate_import_batches\`
      MODIFY COLUMN \`status\` ENUM('pending','processing','completed','failed','partial') NOT NULL DEFAULT 'pending';
    `)
  }
}
