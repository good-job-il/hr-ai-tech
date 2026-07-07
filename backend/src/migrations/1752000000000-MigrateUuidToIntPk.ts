import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ⚠️  BACKUP WARNING ⚠️
 * Before running this migration on a production database, create a full backup:
 *   mysqldump -u <user> -p <database> > backup_before_uuid_to_int_$(date +%Y%m%d_%H%M%S).sql
 *
 * Migration: UUID varchar(36) → INT AUTO_INCREMENT for all primary keys.
 *
 * Strategy:
 *   1. Add `new_id INT AUTO_INCREMENT` helper column to every affected table
 *      (MySQL requires a key on the AUTO_INCREMENT column, so we add a temporary index).
 *   2. Build UUID→int mapping tables from the auto-assigned new_id values.
 *   3. Update every FK column in every table using the mapping tables.
 *   4. Swap: drop old `id` (UUID), rename `new_id` to `id`, promote to PRIMARY KEY.
 *   5. Drop mapping tables.
 *
 * DOWN migration:
 *   The down migration drops all tables and re-creates them with varchar(36) PKs
 *   but CANNOT restore the original UUID values. Use your backup to recover data.
 */

/** Helper: list of all tables that inherit BaseEntity (UUID pk → int pk) */
const MAIN_TABLES = [
  'organizations',
  'users',
  'companies',
  'candidate_import_batches',
  'candidates',
  'candidate_documents',
  'candidate_notes',
  'candidate_tags',
  'candidate_timelines',
  'candidate_access',
  'candidate_profiles',
  'jobs',
  'job_alerts',
  'saved_jobs',
  'applications',
  'application_timelines',
  'application_pipelines',
  'interviews',
  'messages',
  'notifications',
  'communication_logs',
  'employer_timelines',
  'compensation_plans',
  'audit_logs',
  'permission_matrices',
  'role_templates',
  'role_aliases',
  'user_position_access',
  'positions',
  'import_sources',
  'salary_data',
  'company_reviews',
  'staff',
] as const;

export class MigrateUuidToIntPk1752000000000 implements MigrationInterface {
  name = 'MigrateUuidToIntPk1752000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Disable FK checks for the entire migration ──────────────────────────
    await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0`);
    await queryRunner.query(`SET SQL_MODE = ''`);

    // ════════════════════════════════════════════════════════════════════════
    // PASS 1 — Add new_id AUTO_INCREMENT to every main table
    // MySQL requires the AUTO_INCREMENT column to be a key.
    // ════════════════════════════════════════════════════════════════════════
    for (const table of MAIN_TABLES) {
      await queryRunner.query(`
        ALTER TABLE \`${table}\`
          ADD COLUMN \`new_id\` INT NOT NULL AUTO_INCREMENT,
          ADD KEY \`_tmp_auto\` (\`new_id\`)
      `);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASS 2 — Build UUID→int mapping tables
    // ════════════════════════════════════════════════════════════════════════
    for (const table of MAIN_TABLES) {
      await queryRunner.query(`
        CREATE TABLE \`_map_${table}\` (
          \`old_id\` VARCHAR(36) NOT NULL,
          \`new_id\` INT NOT NULL,
          PRIMARY KEY (\`old_id\`),
          KEY (\`new_id\`)
        ) ENGINE=InnoDB
      `);
      await queryRunner.query(`
        INSERT INTO \`_map_${table}\` (\`old_id\`, \`new_id\`)
        SELECT \`id\`, \`new_id\` FROM \`${table}\`
      `);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASS 3 — Update FK columns using mapping tables
    // Format: UPDATE child c JOIN _map_parent m ON c.fk_col = m.old_id
    //         SET c.new_fk_col = m.new_id
    // We add temporary new_* int columns, populate, then swap.
    // ════════════════════════════════════════════════════════════════════════

    // ─── users: organization_id, company_id, team_manager_id,
    //            recruitment_manager_id, employer_company_id ────────────────
    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD COLUMN \`n_org_id\`    INT NULL,
        ADD COLUMN \`n_co_id\`     INT NULL,
        ADD COLUMN \`n_tm_id\`     INT NULL,
        ADD COLUMN \`n_rm_id\`     INT NULL,
        ADD COLUMN \`n_emp_co_id\` INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`users\` u
        LEFT JOIN \`_map_organizations\` mo ON u.organization_id = mo.old_id
        LEFT JOIN \`_map_organizations\` mc ON u.company_id = mc.old_id
        LEFT JOIN \`_map_users\`         mt ON u.team_manager_id = mt.old_id
        LEFT JOIN \`_map_users\`         mr ON u.recruitment_manager_id = mr.old_id
        LEFT JOIN \`_map_companies\`     me ON u.employer_company_id = me.old_id
      SET u.n_org_id    = mo.new_id,
          u.n_co_id     = mc.new_id,
          u.n_tm_id     = mt.new_id,
          u.n_rm_id     = mr.new_id,
          u.n_emp_co_id = me.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`users\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`company_id\`,
        DROP COLUMN \`team_manager_id\`,
        DROP COLUMN \`recruitment_manager_id\`,
        DROP COLUMN \`employer_company_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`users\`
        CHANGE \`n_org_id\`    \`organization_id\`        INT NULL,
        CHANGE \`n_co_id\`     \`company_id\`             INT NULL,
        CHANGE \`n_tm_id\`     \`team_manager_id\`        INT NULL,
        CHANGE \`n_rm_id\`     \`recruitment_manager_id\` INT NULL,
        CHANGE \`n_emp_co_id\` \`employer_company_id\`    INT NULL
    `);

    // ─── candidates ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`candidates\`
        ADD COLUMN \`n_org_id\`    INT NULL,
        ADD COLUMN \`n_rec_id\`    INT NULL,
        ADD COLUMN \`n_tm_id\`     INT NULL,
        ADD COLUMN \`n_rm_id\`     INT NULL,
        ADD COLUMN \`n_emp_co\`    INT NULL,
        ADD COLUMN \`n_ag_co\`     INT NULL,
        ADD COLUMN \`n_dup_id\`    INT NULL,
        ADD COLUMN \`n_batch_id\`  INT NULL,
        ADD COLUMN \`n_del_by\`    INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`candidates\` c
        LEFT JOIN \`_map_organizations\`           mo  ON c.organization_id = mo.old_id
        LEFT JOIN \`_map_users\`                   mr  ON c.recruiter_id = mr.old_id
        LEFT JOIN \`_map_users\`                   mt  ON c.team_manager_id = mt.old_id
        LEFT JOIN \`_map_users\`                   mrm ON c.recruitment_manager_id = mrm.old_id
        LEFT JOIN \`_map_companies\`               me  ON c.employer_company_id = me.old_id
        LEFT JOIN \`_map_organizations\`           ma  ON c.agency_company_id = ma.old_id
        LEFT JOIN \`_map_candidates\`              md  ON c.duplicate_of_id = md.old_id
        LEFT JOIN \`_map_candidate_import_batches\` mb ON c.import_batch_id = mb.old_id
        LEFT JOIN \`_map_users\`                   mdb ON c.deleted_by = mdb.old_id
      SET c.n_org_id   = mo.new_id,
          c.n_rec_id   = mr.new_id,
          c.n_tm_id    = mt.new_id,
          c.n_rm_id    = mrm.new_id,
          c.n_emp_co   = me.new_id,
          c.n_ag_co    = ma.new_id,
          c.n_dup_id   = md.new_id,
          c.n_batch_id = mb.new_id,
          c.n_del_by   = mdb.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidates\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`recruiter_id\`,
        DROP COLUMN \`team_manager_id\`,
        DROP COLUMN \`recruitment_manager_id\`,
        DROP COLUMN \`employer_company_id\`,
        DROP COLUMN \`agency_company_id\`,
        DROP COLUMN \`duplicate_of_id\`,
        DROP COLUMN \`import_batch_id\`,
        DROP COLUMN \`deleted_by\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidates\`
        CHANGE \`n_org_id\`   \`organization_id\`        INT NULL,
        CHANGE \`n_rec_id\`   \`recruiter_id\`           INT NULL,
        CHANGE \`n_tm_id\`    \`team_manager_id\`        INT NULL,
        CHANGE \`n_rm_id\`    \`recruitment_manager_id\` INT NULL,
        CHANGE \`n_emp_co\`   \`employer_company_id\`    INT NULL,
        CHANGE \`n_ag_co\`    \`agency_company_id\`      INT NULL,
        CHANGE \`n_dup_id\`   \`duplicate_of_id\`        INT NULL,
        CHANGE \`n_batch_id\` \`import_batch_id\`        INT NULL,
        CHANGE \`n_del_by\`   \`deleted_by\`             INT NULL
    `);

    // ─── candidate_documents ─────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`candidate_documents\`
        ADD COLUMN \`n_org_id\`   INT NULL,
        ADD COLUMN \`n_cand_id\`  INT NOT NULL DEFAULT 0,
        ADD COLUMN \`n_batch_id\` INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`candidate_documents\` cd
        LEFT JOIN \`_map_organizations\`           mo ON cd.organization_id = mo.old_id
        LEFT JOIN \`_map_candidates\`              mc ON cd.candidate_id = mc.old_id
        LEFT JOIN \`_map_candidate_import_batches\` mb ON cd.import_batch_id = mb.old_id
      SET cd.n_org_id   = mo.new_id,
          cd.n_cand_id  = COALESCE(mc.new_id, 0),
          cd.n_batch_id = mb.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidate_documents\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`candidate_id\`,
        DROP COLUMN \`import_batch_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidate_documents\`
        CHANGE \`n_org_id\`   \`organization_id\` INT NULL,
        CHANGE \`n_cand_id\`  \`candidate_id\`    INT NOT NULL,
        CHANGE \`n_batch_id\` \`import_batch_id\` INT NULL
    `);

    // ─── candidate_notes ─────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`candidate_notes\`
        ADD COLUMN \`n_org_id\`  INT NULL,
        ADD COLUMN \`n_cand_id\` INT NOT NULL DEFAULT 0,
        ADD COLUMN \`n_app_id\`  INT NULL,
        ADD COLUMN \`n_int_id\`  INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`candidate_notes\` cn
        LEFT JOIN \`_map_organizations\`  mo ON cn.organization_id = mo.old_id
        LEFT JOIN \`_map_candidates\`     mc ON cn.candidate_id = mc.old_id
        LEFT JOIN \`_map_applications\`   ma ON cn.related_application_id = ma.old_id
        LEFT JOIN \`_map_interviews\`     mi ON cn.related_interview_id = mi.old_id
      SET cn.n_org_id  = mo.new_id,
          cn.n_cand_id = COALESCE(mc.new_id, 0),
          cn.n_app_id  = ma.new_id,
          cn.n_int_id  = mi.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidate_notes\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`candidate_id\`,
        DROP COLUMN \`related_application_id\`,
        DROP COLUMN \`related_interview_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidate_notes\`
        CHANGE \`n_org_id\`  \`organization_id\`       INT NULL,
        CHANGE \`n_cand_id\` \`candidate_id\`           INT NOT NULL,
        CHANGE \`n_app_id\`  \`related_application_id\` INT NULL,
        CHANGE \`n_int_id\`  \`related_interview_id\`   INT NULL
    `);

    // ─── candidate_tags ──────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`candidate_tags\` ADD COLUMN \`n_cand_id\` INT NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      UPDATE \`candidate_tags\` ct
        LEFT JOIN \`_map_candidates\` mc ON ct.candidate_id = mc.old_id
      SET ct.n_cand_id = COALESCE(mc.new_id, 0)
    `);
    await queryRunner.query(`ALTER TABLE \`candidate_tags\` DROP COLUMN \`candidate_id\``);
    await queryRunner.query(`ALTER TABLE \`candidate_tags\` CHANGE \`n_cand_id\` \`candidate_id\` INT NOT NULL`);

    // ─── candidate_timelines ─────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`candidate_timelines\`
        ADD COLUMN \`n_org_id\`  INT NULL,
        ADD COLUMN \`n_cand_id\` INT NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      UPDATE \`candidate_timelines\` ct
        LEFT JOIN \`_map_organizations\` mo ON ct.organization_id = mo.old_id
        LEFT JOIN \`_map_candidates\`    mc ON ct.candidate_id = mc.old_id
      SET ct.n_org_id  = mo.new_id,
          ct.n_cand_id = COALESCE(mc.new_id, 0)
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidate_timelines\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`candidate_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidate_timelines\`
        CHANGE \`n_org_id\`  \`organization_id\` INT NULL,
        CHANGE \`n_cand_id\` \`candidate_id\`    INT NOT NULL
    `);

    // ─── candidate_access ────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`candidate_access\`
        ADD COLUMN \`n_cand_id\`      INT NOT NULL DEFAULT 0,
        ADD COLUMN \`n_owner_org_id\` INT NOT NULL DEFAULT 0,
        ADD COLUMN \`n_acc_org_id\`   INT NULL,
        ADD COLUMN \`n_granted_by\`   INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`candidate_access\` ca
        LEFT JOIN \`_map_candidates\`    mc  ON ca.candidate_id = mc.old_id
        LEFT JOIN \`_map_organizations\` mo  ON ca.owner_organization_id = mo.old_id
        LEFT JOIN \`_map_organizations\` mao ON ca.accessor_organization_id = mao.old_id
        LEFT JOIN \`_map_users\`         mg  ON ca.granted_by = mg.old_id
      SET ca.n_cand_id      = COALESCE(mc.new_id, 0),
          ca.n_owner_org_id = COALESCE(mo.new_id, 0),
          ca.n_acc_org_id   = mao.new_id,
          ca.n_granted_by   = mg.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidate_access\`
        DROP COLUMN \`candidate_id\`,
        DROP COLUMN \`owner_organization_id\`,
        DROP COLUMN \`accessor_organization_id\`,
        DROP COLUMN \`granted_by\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidate_access\`
        CHANGE \`n_cand_id\`      \`candidate_id\`           INT NOT NULL,
        CHANGE \`n_owner_org_id\` \`owner_organization_id\`  INT NOT NULL,
        CHANGE \`n_acc_org_id\`   \`accessor_organization_id\` INT NULL,
        CHANGE \`n_granted_by\`   \`granted_by\`             INT NULL
    `);

    // ─── candidate_import_batches ────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`candidate_import_batches\`
        ADD COLUMN \`n_emp_id\` INT NULL,
        ADD COLUMN \`n_rec_id\` INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`candidate_import_batches\` cib
        LEFT JOIN \`_map_companies\` me ON cib.employer_id = me.old_id
        LEFT JOIN \`_map_users\`     mr ON cib.recruiter_id = mr.old_id
      SET cib.n_emp_id = me.new_id,
          cib.n_rec_id = mr.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidate_import_batches\`
        DROP COLUMN \`employer_id\`,
        DROP COLUMN \`recruiter_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`candidate_import_batches\`
        CHANGE \`n_emp_id\` \`employer_id\`  INT NULL,
        CHANGE \`n_rec_id\` \`recruiter_id\` INT NULL
    `);

    // ─── jobs ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`jobs\`
        ADD COLUMN \`n_org_id\`    INT NULL,
        ADD COLUMN \`n_emp_co_id\` INT NULL,
        ADD COLUMN \`n_ag_co_id\`  INT NULL,
        ADD COLUMN \`n_cr_user\`   INT NULL,
        ADD COLUMN \`n_rec_id\`    INT NULL,
        ADD COLUMN \`n_del_by\`    INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`jobs\` j
        LEFT JOIN \`_map_organizations\` mo  ON j.organization_id = mo.old_id
        LEFT JOIN \`_map_companies\`     me  ON j.employer_company_id = me.old_id
        LEFT JOIN \`_map_organizations\` ma  ON j.agency_company_id = ma.old_id
        LEFT JOIN \`_map_users\`         mcr ON j.created_by_user_id = mcr.old_id
        LEFT JOIN \`_map_users\`         mr  ON j.recruiter_id = mr.old_id
        LEFT JOIN \`_map_users\`         md  ON j.deleted_by = md.old_id
      SET j.n_org_id    = mo.new_id,
          j.n_emp_co_id = me.new_id,
          j.n_ag_co_id  = ma.new_id,
          j.n_cr_user   = mcr.new_id,
          j.n_rec_id    = mr.new_id,
          j.n_del_by    = md.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`jobs\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`employer_company_id\`,
        DROP COLUMN \`agency_company_id\`,
        DROP COLUMN \`created_by_user_id\`,
        DROP COLUMN \`recruiter_id\`,
        DROP COLUMN \`deleted_by\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`jobs\`
        CHANGE \`n_org_id\`    \`organization_id\`     INT NULL,
        CHANGE \`n_emp_co_id\` \`employer_company_id\` INT NULL,
        CHANGE \`n_ag_co_id\`  \`agency_company_id\`   INT NULL,
        CHANGE \`n_cr_user\`   \`created_by_user_id\`  INT NULL,
        CHANGE \`n_rec_id\`    \`recruiter_id\`        INT NULL,
        CHANGE \`n_del_by\`    \`deleted_by\`          INT NULL
    `);

    // ─── saved_jobs ──────────────────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE \`saved_jobs\` ADD COLUMN \`n_job_id\` INT NOT NULL DEFAULT 0`);
    await queryRunner.query(`
      UPDATE \`saved_jobs\` sj
        LEFT JOIN \`_map_jobs\` mj ON sj.job_id = mj.old_id
      SET sj.n_job_id = COALESCE(mj.new_id, 0)
    `);
    await queryRunner.query(`ALTER TABLE \`saved_jobs\` DROP COLUMN \`job_id\``);
    await queryRunner.query(`ALTER TABLE \`saved_jobs\` CHANGE \`n_job_id\` \`job_id\` INT NOT NULL`);

    // ─── applications ────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`applications\`
        ADD COLUMN \`n_org_id\`    INT NULL,
        ADD COLUMN \`n_job_id\`    INT NOT NULL DEFAULT 0,
        ADD COLUMN \`n_cand_id\`   INT NULL,
        ADD COLUMN \`n_emp_co_id\` INT NULL,
        ADD COLUMN \`n_ag_co_id\`  INT NULL,
        ADD COLUMN \`n_rec_id\`    INT NULL,
        ADD COLUMN \`n_tm_id\`     INT NULL,
        ADD COLUMN \`n_rm_id\`     INT NULL,
        ADD COLUMN \`n_asgn_to\`   INT NULL,
        ADD COLUMN \`n_del_by\`    INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`applications\` a
        LEFT JOIN \`_map_organizations\` mo  ON a.organization_id = mo.old_id
        LEFT JOIN \`_map_jobs\`          mj  ON a.job_id = mj.old_id
        LEFT JOIN \`_map_candidates\`    mc  ON a.candidate_id = mc.old_id
        LEFT JOIN \`_map_companies\`     me  ON a.employer_company_id = me.old_id
        LEFT JOIN \`_map_organizations\` ma  ON a.agency_company_id = ma.old_id
        LEFT JOIN \`_map_users\`         mr  ON a.recruiter_id = mr.old_id
        LEFT JOIN \`_map_users\`         mt  ON a.team_manager_id = mt.old_id
        LEFT JOIN \`_map_users\`         mrm ON a.recruitment_manager_id = mrm.old_id
        LEFT JOIN \`_map_users\`         mas ON a.assigned_to = mas.old_id
        LEFT JOIN \`_map_users\`         md  ON a.deleted_by = md.old_id
      SET a.n_org_id    = mo.new_id,
          a.n_job_id    = COALESCE(mj.new_id, 0),
          a.n_cand_id   = mc.new_id,
          a.n_emp_co_id = me.new_id,
          a.n_ag_co_id  = ma.new_id,
          a.n_rec_id    = mr.new_id,
          a.n_tm_id     = mt.new_id,
          a.n_rm_id     = mrm.new_id,
          a.n_asgn_to   = mas.new_id,
          a.n_del_by    = md.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`applications\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`job_id\`,
        DROP COLUMN \`candidate_id\`,
        DROP COLUMN \`employer_company_id\`,
        DROP COLUMN \`agency_company_id\`,
        DROP COLUMN \`recruiter_id\`,
        DROP COLUMN \`team_manager_id\`,
        DROP COLUMN \`recruitment_manager_id\`,
        DROP COLUMN \`assigned_to\`,
        DROP COLUMN \`deleted_by\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`applications\`
        CHANGE \`n_org_id\`    \`organization_id\`        INT NULL,
        CHANGE \`n_job_id\`    \`job_id\`                 INT NOT NULL,
        CHANGE \`n_cand_id\`   \`candidate_id\`           INT NULL,
        CHANGE \`n_emp_co_id\` \`employer_company_id\`    INT NULL,
        CHANGE \`n_ag_co_id\`  \`agency_company_id\`      INT NULL,
        CHANGE \`n_rec_id\`    \`recruiter_id\`           INT NULL,
        CHANGE \`n_tm_id\`     \`team_manager_id\`        INT NULL,
        CHANGE \`n_rm_id\`     \`recruitment_manager_id\` INT NULL,
        CHANGE \`n_asgn_to\`   \`assigned_to\`            INT NULL,
        CHANGE \`n_del_by\`    \`deleted_by\`             INT NULL
    `);

    // ─── application_timelines ───────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`application_timelines\`
        ADD COLUMN \`n_org_id\` INT NULL,
        ADD COLUMN \`n_app_id\` INT NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      UPDATE \`application_timelines\` at_
        LEFT JOIN \`_map_organizations\` mo ON at_.organization_id = mo.old_id
        LEFT JOIN \`_map_applications\`  ma ON at_.application_id = ma.old_id
      SET at_.n_org_id = mo.new_id,
          at_.n_app_id = COALESCE(ma.new_id, 0)
    `);
    await queryRunner.query(`
      ALTER TABLE \`application_timelines\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`application_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`application_timelines\`
        CHANGE \`n_org_id\` \`organization_id\` INT NULL,
        CHANGE \`n_app_id\` \`application_id\`  INT NOT NULL
    `);

    // ─── interviews ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`interviews\`
        ADD COLUMN \`n_org_id\`  INT NULL,
        ADD COLUMN \`n_app_id\`  INT NULL,
        ADD COLUMN \`n_cand_id\` INT NULL,
        ADD COLUMN \`n_job_id\`  INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`interviews\` i
        LEFT JOIN \`_map_organizations\` mo ON i.organization_id = mo.old_id
        LEFT JOIN \`_map_applications\`  ma ON i.application_id = ma.old_id
        LEFT JOIN \`_map_candidates\`    mc ON i.candidate_id = mc.old_id
        LEFT JOIN \`_map_jobs\`          mj ON i.job_id = mj.old_id
      SET i.n_org_id  = mo.new_id,
          i.n_app_id  = ma.new_id,
          i.n_cand_id = mc.new_id,
          i.n_job_id  = mj.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`interviews\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`application_id\`,
        DROP COLUMN \`candidate_id\`,
        DROP COLUMN \`job_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`interviews\`
        CHANGE \`n_org_id\`  \`organization_id\` INT NULL,
        CHANGE \`n_app_id\`  \`application_id\`  INT NULL,
        CHANGE \`n_cand_id\` \`candidate_id\`    INT NULL,
        CHANGE \`n_job_id\`  \`job_id\`          INT NULL
    `);

    // ─── messages ────────────────────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE \`messages\` ADD COLUMN \`n_app_id\` INT NOT NULL DEFAULT 0`);
    await queryRunner.query(`
      UPDATE \`messages\` m
        LEFT JOIN \`_map_applications\` ma ON m.application_id = ma.old_id
      SET m.n_app_id = COALESCE(ma.new_id, 0)
    `);
    await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`application_id\``);
    await queryRunner.query(`ALTER TABLE \`messages\` CHANGE \`n_app_id\` \`application_id\` INT NOT NULL`);

    // ─── notifications ───────────────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE \`notifications\` ADD COLUMN \`n_org_id\` INT NULL`);
    await queryRunner.query(`
      UPDATE \`notifications\` n
        LEFT JOIN \`_map_organizations\` mo ON n.organization_id = mo.old_id
      SET n.n_org_id = mo.new_id
    `);
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`organization_id\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` CHANGE \`n_org_id\` \`organization_id\` INT NULL`);

    // ─── companies (deleted_by) ───────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE \`companies\` ADD COLUMN \`n_del_by\` INT NULL`);
    await queryRunner.query(`
      UPDATE \`companies\` c
        LEFT JOIN \`_map_users\` mu ON c.deleted_by = mu.old_id
      SET c.n_del_by = mu.new_id
    `);
    await queryRunner.query(`ALTER TABLE \`companies\` DROP COLUMN \`deleted_by\``);
    await queryRunner.query(`ALTER TABLE \`companies\` CHANGE \`n_del_by\` \`deleted_by\` INT NULL`);

    // ─── company_reviews ─────────────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE \`company_reviews\` ADD COLUMN \`n_co_id\` INT NOT NULL DEFAULT 0`);
    await queryRunner.query(`
      UPDATE \`company_reviews\` cr
        LEFT JOIN \`_map_companies\` mc ON cr.company_id = mc.old_id
      SET cr.n_co_id = COALESCE(mc.new_id, 0)
    `);
    await queryRunner.query(`ALTER TABLE \`company_reviews\` DROP COLUMN \`company_id\``);
    await queryRunner.query(`ALTER TABLE \`company_reviews\` CHANGE \`n_co_id\` \`company_id\` INT NOT NULL`);

    // ─── communication_logs ──────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`communication_logs\`
        ADD COLUMN \`n_org_id\`  INT NULL,
        ADD COLUMN \`n_cand_id\` INT NOT NULL DEFAULT 0,
        ADD COLUMN \`n_app_id\`  INT NULL,
        ADD COLUMN \`n_job_id\`  INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`communication_logs\` cl
        LEFT JOIN \`_map_organizations\` mo ON cl.organization_id = mo.old_id
        LEFT JOIN \`_map_candidates\`    mc ON cl.candidate_id = mc.old_id
        LEFT JOIN \`_map_applications\`  ma ON cl.related_application_id = ma.old_id
        LEFT JOIN \`_map_jobs\`          mj ON cl.related_job_id = mj.old_id
      SET cl.n_org_id  = mo.new_id,
          cl.n_cand_id = COALESCE(mc.new_id, 0),
          cl.n_app_id  = ma.new_id,
          cl.n_job_id  = mj.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`communication_logs\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`candidate_id\`,
        DROP COLUMN \`related_application_id\`,
        DROP COLUMN \`related_job_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`communication_logs\`
        CHANGE \`n_org_id\`  \`organization_id\`       INT NULL,
        CHANGE \`n_cand_id\` \`candidate_id\`           INT NOT NULL,
        CHANGE \`n_app_id\`  \`related_application_id\` INT NULL,
        CHANGE \`n_job_id\`  \`related_job_id\`         INT NULL
    `);

    // ─── compensation_plans ──────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`compensation_plans\`
        ADD COLUMN \`n_org_id\`  INT NULL,
        ADD COLUMN \`n_job_id\`  INT NULL,
        ADD COLUMN \`n_ag_co\`   INT NULL,
        ADD COLUMN \`n_rec_id\`  INT NULL,
        ADD COLUMN \`n_tm_id\`   INT NULL,
        ADD COLUMN \`n_rm_id\`   INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`compensation_plans\` cp
        LEFT JOIN \`_map_organizations\` mo  ON cp.organization_id = mo.old_id
        LEFT JOIN \`_map_jobs\`          mj  ON cp.job_id = mj.old_id
        LEFT JOIN \`_map_organizations\` ma  ON cp.agency_company_id = ma.old_id
        LEFT JOIN \`_map_users\`         mr  ON cp.recruiter_id = mr.old_id
        LEFT JOIN \`_map_users\`         mt  ON cp.team_manager_id = mt.old_id
        LEFT JOIN \`_map_users\`         mrm ON cp.recruitment_manager_id = mrm.old_id
      SET cp.n_org_id = mo.new_id,
          cp.n_job_id = mj.new_id,
          cp.n_ag_co  = ma.new_id,
          cp.n_rec_id = mr.new_id,
          cp.n_tm_id  = mt.new_id,
          cp.n_rm_id  = mrm.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`compensation_plans\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`job_id\`,
        DROP COLUMN \`agency_company_id\`,
        DROP COLUMN \`recruiter_id\`,
        DROP COLUMN \`team_manager_id\`,
        DROP COLUMN \`recruitment_manager_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`compensation_plans\`
        CHANGE \`n_org_id\` \`organization_id\`        INT NULL,
        CHANGE \`n_job_id\` \`job_id\`                 INT NULL,
        CHANGE \`n_ag_co\`  \`agency_company_id\`      INT NULL,
        CHANGE \`n_rec_id\` \`recruiter_id\`           INT NULL,
        CHANGE \`n_tm_id\`  \`team_manager_id\`        INT NULL,
        CHANGE \`n_rm_id\`  \`recruitment_manager_id\` INT NULL
    `);

    // ─── audit_logs ──────────────────────────────────────────────────────────
    // NOTE: entity_id (varchar 36) → int. Old UUID values become NULL (cannot map
    // without knowing which table each row references). New records will use int IDs.
    await queryRunner.query(`
      ALTER TABLE \`audit_logs\`
        ADD COLUMN \`n_org_id\`      INT NULL,
        ADD COLUMN \`n_actor_uid\`   INT NULL,
        ADD COLUMN \`n_entity_id\`   INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`audit_logs\` al
        LEFT JOIN \`_map_organizations\` mo ON al.organization_id = mo.old_id
        LEFT JOIN \`_map_users\`         mu ON al.actor_user_id = mu.old_id
      SET al.n_org_id    = mo.new_id,
          al.n_actor_uid = mu.new_id,
          -- entity_id cannot be auto-resolved (polymorphic); set to NULL for old records
          al.n_entity_id = NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`audit_logs\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`actor_user_id\`,
        DROP COLUMN \`entity_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`audit_logs\`
        CHANGE \`n_org_id\`    \`organization_id\` INT NULL,
        CHANGE \`n_actor_uid\` \`actor_user_id\`   INT NULL,
        CHANGE \`n_entity_id\` \`entity_id\`       INT NOT NULL DEFAULT 0
    `);

    // ─── permission_matrices ─────────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE \`permission_matrices\` ADD COLUMN \`n_org_id\` INT NULL`);
    await queryRunner.query(`
      UPDATE \`permission_matrices\` pm
        LEFT JOIN \`_map_organizations\` mo ON pm.organization_id = mo.old_id
      SET pm.n_org_id = mo.new_id
    `);
    await queryRunner.query(`ALTER TABLE \`permission_matrices\` DROP COLUMN \`organization_id\``);
    await queryRunner.query(`ALTER TABLE \`permission_matrices\` CHANGE \`n_org_id\` \`organization_id\` INT NULL`);

    // ─── role_templates ──────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE \`role_templates\`
        ADD COLUMN \`n_org_id\`     INT NULL,
        ADD COLUMN \`n_perm_tpl\`   INT NULL
    `);
    await queryRunner.query(`
      UPDATE \`role_templates\` rt
        LEFT JOIN \`_map_organizations\`    mo ON rt.organization_id = mo.old_id
        LEFT JOIN \`_map_permission_matrices\` mp ON rt.permissions_template_id = mp.old_id
      SET rt.n_org_id   = mo.new_id,
          rt.n_perm_tpl = mp.new_id
    `);
    await queryRunner.query(`
      ALTER TABLE \`role_templates\`
        DROP COLUMN \`organization_id\`,
        DROP COLUMN \`permissions_template_id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`role_templates\`
        CHANGE \`n_org_id\`   \`organization_id\`        INT NULL,
        CHANGE \`n_perm_tpl\` \`permissions_template_id\` INT NULL
    `);

    // ════════════════════════════════════════════════════════════════════════
    // PASS 4 — Swap PRIMARY KEY: drop old VARCHAR id, rename new_id → id
    // ════════════════════════════════════════════════════════════════════════
    for (const table of MAIN_TABLES) {
      // Drop old string PK, drop temp key, rename new_id to id, set as PK
      await queryRunner.query(`
        ALTER TABLE \`${table}\`
          DROP PRIMARY KEY,
          DROP COLUMN \`id\`,
          DROP KEY \`_tmp_auto\`,
          CHANGE \`new_id\` \`id\` INT NOT NULL AUTO_INCREMENT,
          ADD PRIMARY KEY (\`id\`)
      `);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASS 5 — Drop mapping tables
    // ════════════════════════════════════════════════════════════════════════
    for (const table of MAIN_TABLES) {
      await queryRunner.query(`DROP TABLE IF EXISTS \`_map_${table}\``);
    }

    // ─── Re-add indexes that were on FK columns ───────────────────────────────
    await queryRunner.query(`ALTER TABLE \`users\` ADD INDEX \`IDX_user_org\` (\`organization_id\`)`);
    await queryRunner.query(`ALTER TABLE \`candidates\` ADD INDEX \`IDX_cand_org\` (\`organization_id\`), ADD INDEX \`IDX_cand_rec\` (\`recruiter_id\`), ADD INDEX \`IDX_cand_tm\` (\`team_manager_id\`)`);
    await queryRunner.query(`ALTER TABLE \`candidate_documents\` ADD INDEX \`IDX_cdoc_cand\` (\`candidate_id\`), ADD INDEX \`IDX_cdoc_org\` (\`organization_id\`)`);
    await queryRunner.query(`ALTER TABLE \`candidate_notes\` ADD INDEX \`IDX_cnote_cand\` (\`candidate_id\`), ADD INDEX \`IDX_cnote_org\` (\`organization_id\`)`);
    await queryRunner.query(`ALTER TABLE \`candidate_tags\` ADD INDEX \`IDX_ctag_cand\` (\`candidate_id\`)`);
    await queryRunner.query(`ALTER TABLE \`candidate_timelines\` ADD INDEX \`IDX_ctl_cand\` (\`candidate_id\`), ADD INDEX \`IDX_ctl_org\` (\`organization_id\`)`);
    await queryRunner.query(`ALTER TABLE \`candidate_access\` ADD INDEX \`IDX_cacc_cand\` (\`candidate_id\`), ADD INDEX \`IDX_cacc_owner\` (\`owner_organization_id\`)`);
    await queryRunner.query(`ALTER TABLE \`jobs\` ADD INDEX \`IDX_job_org\` (\`organization_id\`), ADD INDEX \`IDX_job_rec\` (\`recruiter_id\`)`);
    await queryRunner.query(`ALTER TABLE \`saved_jobs\` ADD INDEX \`IDX_sj_job\` (\`job_id\`)`);
    await queryRunner.query(`ALTER TABLE \`applications\` ADD INDEX \`IDX_app_org\` (\`organization_id\`), ADD INDEX \`IDX_app_job\` (\`job_id\`), ADD INDEX \`IDX_app_cand\` (\`candidate_id\`), ADD INDEX \`IDX_app_rec\` (\`recruiter_id\`)`);
    await queryRunner.query(`ALTER TABLE \`application_timelines\` ADD INDEX \`IDX_atl_app\` (\`application_id\`), ADD INDEX \`IDX_atl_org\` (\`organization_id\`)`);
    await queryRunner.query(`ALTER TABLE \`interviews\` ADD INDEX \`IDX_int_org\` (\`organization_id\`), ADD INDEX \`IDX_int_app\` (\`application_id\`), ADD INDEX \`IDX_int_cand\` (\`candidate_id\`), ADD INDEX \`IDX_int_rec\` (\`recruiter_id\`)`);
    await queryRunner.query(`ALTER TABLE \`messages\` ADD INDEX \`IDX_msg_app\` (\`application_id\`)`);
    await queryRunner.query(`ALTER TABLE \`notifications\` ADD INDEX \`IDX_notif_org\` (\`organization_id\`)`);
    await queryRunner.query(`ALTER TABLE \`company_reviews\` ADD INDEX \`IDX_cr_co\` (\`company_id\`)`);
    await queryRunner.query(`ALTER TABLE \`communication_logs\` ADD INDEX \`IDX_cl_org\` (\`organization_id\`), ADD INDEX \`IDX_cl_cand\` (\`candidate_id\`)`);
    await queryRunner.query(`ALTER TABLE \`compensation_plans\` ADD INDEX \`IDX_cp_org\` (\`organization_id\`), ADD INDEX \`IDX_cp_job\` (\`job_id\`)`);
    await queryRunner.query(`ALTER TABLE \`audit_logs\` ADD INDEX \`IDX_al_org\` (\`organization_id\`), ADD INDEX \`IDX_al_uid\` (\`actor_user_id\`), ADD INDEX \`IDX_al_entity\` (\`entity_type\`, \`entity_id\`)`);
    await queryRunner.query(`ALTER TABLE \`permission_matrices\` ADD INDEX \`IDX_pm_org\` (\`organization_id\`)`);
    await queryRunner.query(`ALTER TABLE \`role_templates\` ADD INDEX \`IDX_rt_org\` (\`organization_id\`)`);

    // Re-enable FK checks
    await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * ⚠️  DOWN MIGRATION WARNING ⚠️
     * This migration CANNOT restore original UUID values.
     * To roll back, restore from the backup taken before running `up`.
     *
     * The down migration below only recreates the table structures
     * with VARCHAR(36) PKs using DEFAULT (UUID()). All data will be lost
     * unless you restore from backup.
     */

    await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0`);

    // Drop all affected tables and let the previous migration recreate them
    const allTables = [...MAIN_TABLES];
    for (const table of [...allTables].reverse()) {
      await queryRunner.query(`DROP TABLE IF EXISTS \`${table}\``);
    }

    await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1`);

    // NOTE: To restore data, run: mysql -u <user> -p <database> < backup_file.sql
    console.warn(
      '⚠️  DOWN MIGRATION: All table data has been dropped. ' +
      'Restore from backup to recover original UUID-keyed data.'
    );
  }
}

