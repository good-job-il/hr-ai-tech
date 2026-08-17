import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrgAdminCoreOperations1752700000000 implements MigrationInterface {
  name = 'OrgAdminCoreOperations1752700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`jobs\` ADD COLUMN \`state\` ENUM('draft','open','on_hold','filled','closed') NOT NULL DEFAULT 'open' AFTER \`is_closed\``);
    await queryRunner.query(`UPDATE \`jobs\` SET \`state\` = CASE WHEN \`is_closed\` = 1 THEN 'closed' ELSE 'open' END`);
    await queryRunner.query(`CREATE INDEX \`IDX_jobs_state\` ON \`jobs\` (\`state\`)`);

    await queryRunner.query(`ALTER TABLE \`candidates\` ADD COLUMN \`import_row_number\` INT NULL AFTER \`import_batch_id\``);
    await queryRunner.query(`CREATE UNIQUE INDEX \`UQ_candidate_import_row\` ON \`candidates\` (\`organization_id\`, \`import_batch_id\`, \`import_row_number\`)`);

    await queryRunner.query(`ALTER TABLE \`compensation_plans\` ADD COLUMN \`employer_company_id\` INT NULL AFTER \`job_id\`, ADD COLUMN \`agency_client_id\` INT NULL AFTER \`employer_company_id\``);
    await queryRunner.query(`UPDATE \`compensation_plans\` cp JOIN \`jobs\` j ON j.id = cp.job_id SET cp.employer_company_id = j.employer_company_id WHERE cp.job_id IS NOT NULL`);
    await queryRunner.query(`UPDATE \`compensation_plans\` cp JOIN \`agency_clients\` ac ON ac.organization_id = cp.organization_id AND ac.company_id = cp.employer_company_id SET cp.agency_client_id = ac.id WHERE cp.employer_company_id IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX \`IDX_compensation_employer_company\` ON \`compensation_plans\` (\`employer_company_id\`)`);
    await queryRunner.query(`CREATE INDEX \`IDX_compensation_agency_client\` ON \`compensation_plans\` (\`agency_client_id\`)`);

    await queryRunner.query(`CREATE UNIQUE INDEX \`UQ_app_org_job_candidate\` ON \`applications\` (\`organization_id\`, \`job_id\`, \`candidate_id\`)`);
    await queryRunner.query(`ALTER TABLE \`applications\` MODIFY COLUMN \`candidate_email\` VARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE \`application_timelines\` MODIFY COLUMN \`event_type\` ENUM('submitted','status_changed','note_added','message_sent','interview_scheduled','interview_completed','offer_made','rejected','assigned','resume_viewed') NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`application_timelines\` WHERE \`event_type\` = 'message_sent'`);
    await queryRunner.query(`ALTER TABLE \`application_timelines\` MODIFY COLUMN \`event_type\` ENUM('submitted','status_changed','note_added','interview_scheduled','interview_completed','offer_made','rejected','assigned','resume_viewed') NOT NULL`);
    await queryRunner.query(`UPDATE \`applications\` SET \`candidate_email\` = CONCAT('unknown+', \`id\`, '@invalid.local') WHERE \`candidate_email\` IS NULL`);
    await queryRunner.query(`ALTER TABLE \`applications\` MODIFY COLUMN \`candidate_email\` VARCHAR(255) NOT NULL`);
    await queryRunner.query(`DROP INDEX \`UQ_app_org_job_candidate\` ON \`applications\``);
    await queryRunner.query(`DROP INDEX \`IDX_compensation_agency_client\` ON \`compensation_plans\``);
    await queryRunner.query(`DROP INDEX \`IDX_compensation_employer_company\` ON \`compensation_plans\``);
    await queryRunner.query(`ALTER TABLE \`compensation_plans\` DROP COLUMN \`agency_client_id\`, DROP COLUMN \`employer_company_id\``);
    await queryRunner.query(`DROP INDEX \`UQ_candidate_import_row\` ON \`candidates\``);
    await queryRunner.query(`ALTER TABLE \`candidates\` DROP COLUMN \`import_row_number\``);
    await queryRunner.query(`DROP INDEX \`IDX_jobs_state\` ON \`jobs\``);
    await queryRunner.query(`ALTER TABLE \`jobs\` DROP COLUMN \`state\``);
  }
}
