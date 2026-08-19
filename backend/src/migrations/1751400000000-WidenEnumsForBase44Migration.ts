import { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Phase 6 — Widen ENUM columns to match values discovered in the real Base44
 * production dataset during `migrate-from-base44.ts`. Base44's own schema
 * definitions (`base44/entities/*.jsonc`) list a narrower set of enum values
 * than what actually exists in the live data — this migration reconciles
 * the two.
 */
export class WidenEnumsForBase44Migration1751400000000 implements MigrationInterface {
  name = "WidenEnumsForBase44Migration1751400000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // candidates.source — add 'pool' (general talent pool assignment)
    await queryRunner.query(`
      ALTER TABLE \`candidates\`
      MODIFY COLUMN \`source\` ENUM('import','manual','linkedin','upload','crawl','pool') NULL DEFAULT 'manual';
    `)

    // candidate_notes.visibility — add 'internal'
    await queryRunner.query(`
      ALTER TABLE \`candidate_notes\`
      MODIFY COLUMN \`visibility\` ENUM('private','team','all','internal') NULL DEFAULT 'team';
    `)

    // candidate_documents.conversion_status — add 'not_needed'
    await queryRunner.query(`
      ALTER TABLE \`candidate_documents\`
      MODIFY COLUMN \`conversion_status\` ENUM('pending','success','failed','not_needed') NULL DEFAULT 'pending';
    `)

    // application_timelines.performed_by_role — add 'super_admin'
    await queryRunner.query(`
      ALTER TABLE \`application_timelines\`
      MODIFY COLUMN \`performed_by_role\` ENUM('candidate','employer','recruiter','team_manager','recruitment_manager','org_admin','admin','super_admin') NULL;
    `)

    // audit_logs.action — add 'role_display_name_update', 'permission_update'
    await queryRunner.query(`
      ALTER TABLE \`audit_logs\`
      MODIFY COLUMN \`action\` ENUM('view','create','update','delete','cv_download','cv_view','status_change','send_to_employer','export','compensation_change','login','impersonate','restore','role_display_name_update','permission_update') NOT NULL;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`audit_logs\`
      MODIFY COLUMN \`action\` ENUM('view','create','update','delete','cv_download','cv_view','status_change','send_to_employer','export','compensation_change','login','impersonate','restore') NOT NULL;
    `)
    await queryRunner.query(`
      ALTER TABLE \`application_timelines\`
      MODIFY COLUMN \`performed_by_role\` ENUM('candidate','employer','recruiter','team_manager','recruitment_manager','org_admin','admin') NULL;
    `)
    await queryRunner.query(`
      ALTER TABLE \`candidate_documents\`
      MODIFY COLUMN \`conversion_status\` ENUM('pending','success','failed') NULL DEFAULT 'pending';
    `)
    await queryRunner.query(`
      ALTER TABLE \`candidate_notes\`
      MODIFY COLUMN \`visibility\` ENUM('private','team','all') NULL DEFAULT 'team';
    `)
    await queryRunner.query(`
      ALTER TABLE \`candidates\`
      MODIFY COLUMN \`source\` ENUM('import','manual','linkedin','upload','crawl') NULL DEFAULT 'manual';
    `)
  }
}
