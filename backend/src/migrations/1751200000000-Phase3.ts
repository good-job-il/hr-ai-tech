import { MigrationInterface, QueryRunner } from "typeorm"

export class Phase31751200000000 implements MigrationInterface {
  name = "Phase31751200000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── audit_logs ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\`              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\` VARCHAR(36)  NULL,
        \`actor_user_id\`   VARCHAR(36)  NULL,
        \`actor_email\`     VARCHAR(255) NULL,
        \`actor_role\`      VARCHAR(50)  NULL,
        \`entity_type\`     ENUM('Candidate','Application','Job','Company','CandidateDocument','CompensationPlan','User','Organization','Interview','CommunicationLog') NOT NULL,
        \`entity_id\`       VARCHAR(36)  NOT NULL,
        \`entity_label\`    VARCHAR(255) NULL,
        \`action\`          ENUM('view','create','update','delete','cv_download','cv_view','status_change','send_to_employer','export','compensation_change','login','impersonate','restore') NOT NULL,
        \`metadata\`        JSON         NULL,
        \`ip_address\`      VARCHAR(45)  NULL,
        \`user_agent\`      TEXT         NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_audit_org\`    (\`organization_id\`),
        INDEX \`IDX_audit_entity\` (\`entity_type\`, \`entity_id\`),
        INDEX \`IDX_audit_actor\`  (\`actor_user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── communication_logs ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`communication_logs\` (
        \`id\`                     VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`        VARCHAR(36)  NULL,
        \`candidate_id\`           VARCHAR(36)  NOT NULL,
        \`candidate_email\`        VARCHAR(255) NULL,
        \`channel\`                ENUM('email','whatsapp','phone','sms','in_app','other') NOT NULL DEFAULT 'email',
        \`direction\`              ENUM('inbound','outbound') NOT NULL DEFAULT 'outbound',
        \`sender_email\`           VARCHAR(255) NOT NULL,
        \`sender_name\`            VARCHAR(255) NULL,
        \`subject\`                VARCHAR(255) NULL,
        \`content\`                TEXT         NOT NULL,
        \`status\`                 ENUM('sent','delivered','read','failed','pending') NOT NULL DEFAULT 'sent',
        \`related_application_id\` VARCHAR(36)  NULL,
        \`related_job_id\`         VARCHAR(36)  NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_comm_org\`  (\`organization_id\`),
        INDEX \`IDX_comm_cand\` (\`candidate_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── employer_timelines ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`employer_timelines\` (
        \`id\`             VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`employer_email\` VARCHAR(255) NOT NULL,
        \`event_type\`     ENUM('account_created','job_posted','application_received','candidate_viewed','status_changed','note_added','team_member_added','setting_changed','import_completed') NOT NULL,
        \`description\`    TEXT         NOT NULL,
        \`metadata\`       JSON         NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_etl_email\` (\`employer_email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── compensation_plans ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`compensation_plans\` (
        \`id\`                                     VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`                           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`                           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`                        VARCHAR(36)  NULL,
        \`job_id\`                                  VARCHAR(36)  NULL,
        \`client_name\`                             VARCHAR(255) NOT NULL,
        \`agency_company_id\`                       VARCHAR(36)  NULL,
        \`total_fee\`                               DECIMAL(12,2) NULL,
        \`warranty_period_days\`                    INT          NOT NULL DEFAULT 30,
        \`recruiter_id\`                            VARCHAR(36)  NULL,
        \`team_manager_id\`                         VARCHAR(36)  NULL,
        \`recruitment_manager_id\`                  VARCHAR(36)  NULL,
        \`recruiter_compensation\`                  DECIMAL(12,2) NULL,
        \`recruiter_compensation_type\`             ENUM('fixed','percent') NOT NULL DEFAULT 'percent',
        \`team_manager_compensation\`               DECIMAL(12,2) NULL,
        \`team_manager_compensation_type\`          ENUM('fixed','percent') NOT NULL DEFAULT 'percent',
        \`recruitment_manager_compensation\`        DECIMAL(12,2) NULL,
        \`recruitment_manager_compensation_type\`   ENUM('fixed','percent') NOT NULL DEFAULT 'percent',
        \`notes\`                                   TEXT         NULL,
        \`created_by_role\`                         VARCHAR(50)  NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_comp_org\` (\`organization_id\`),
        INDEX \`IDX_comp_job\` (\`job_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── permission_matrices ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`permission_matrices\` (
        \`id\`              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\` VARCHAR(36)  NULL,
        \`org_type\`        ENUM('staffing_agency','organization') NULL,
        \`role_key\`        VARCHAR(100) NOT NULL,
        \`is_template\`     TINYINT(1)   NOT NULL DEFAULT 0,
        \`permissions\`     JSON         NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_pm_org\`  (\`organization_id\`),
        INDEX \`IDX_pm_role\` (\`role_key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── role_templates ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`role_templates\` (
        \`id\`                       VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`             DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`             DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`          VARCHAR(36)  NULL,
        \`org_type\`                 ENUM('staffing_agency','organization') NOT NULL,
        \`system_role_key\`          VARCHAR(100) NOT NULL,
        \`display_name\`             VARCHAR(255) NOT NULL,
        \`parent_role_key\`          VARCHAR(100) NULL,
        \`hierarchy_level\`          INT          NULL,
        \`is_editable_name\`         TINYINT(1)   NOT NULL DEFAULT 1,
        \`is_system_required\`       TINYINT(1)   NOT NULL DEFAULT 1,
        \`permissions_template_id\`  VARCHAR(36)  NULL,
        \`is_active\`                TINYINT(1)   NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_rt_org\`  (\`organization_id\`),
        INDEX \`IDX_rt_role\` (\`system_role_key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── role_aliases ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`role_aliases\` (
        \`id\`              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`alias\`           VARCHAR(100) NOT NULL,
        \`canonical_role\`  VARCHAR(100) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_alias_unique\` (\`alias\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── user_position_access ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`user_position_access\` (
        \`id\`                         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`               DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`               DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`company_email\`              VARCHAR(255) NOT NULL,
        \`user_email\`                 VARCHAR(255) NOT NULL,
        \`user_name\`                  VARCHAR(255) NULL,
        \`user_type\`                  ENUM('team_manager','recruiter') NOT NULL,
        \`position_ids\`               JSON         NULL,
        \`can_review_applications\`    TINYINT(1)   NOT NULL DEFAULT 1,
        \`can_schedule_interviews\`    TINYINT(1)   NOT NULL DEFAULT 1,
        \`can_send_messages\`          TINYINT(1)   NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_upa_company\` (\`company_email\`),
        INDEX \`IDX_upa_user\`    (\`user_email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── positions ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`positions\` (
        \`id\`                    VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`company_email\`         VARCHAR(255) NOT NULL,
        \`title\`                 VARCHAR(255) NOT NULL,
        \`department\`            VARCHAR(255) NULL,
        \`description\`           TEXT         NULL,
        \`required_experience\`   INT          NULL,
        \`skills\`                JSON         NULL,
        \`salary_min\`            INT          NULL,
        \`salary_max\`            INT          NULL,
        \`is_active\`             TINYINT(1)   NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_position_company\` (\`company_email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── import_sources ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`import_sources\` (
        \`id\`                  VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`name\`                VARCHAR(255) NOT NULL,
        \`provider\`            VARCHAR(100) NULL,
        \`url\`                 TEXT         NOT NULL,
        \`interval_hours\`      INT          NOT NULL DEFAULT 6,
        \`is_active\`           TINYINT(1)   NOT NULL DEFAULT 1,
        \`last_sync\`           DATETIME     NULL,
        \`last_sync_status\`    ENUM('success','error','pending') NOT NULL DEFAULT 'pending',
        \`last_error\`          TEXT         NULL,
        \`jobs_added\`          INT          NOT NULL DEFAULT 0,
        \`jobs_updated\`        INT          NOT NULL DEFAULT 0,
        \`jobs_closed\`         INT          NOT NULL DEFAULT 0,
        \`logs\`                JSON         NULL,
        \`retry_count\`         INT          NOT NULL DEFAULT 0,
        \`last_retry_attempt\`  DATETIME     NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_import_src_active\` (\`is_active\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── salary_data ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`salary_data\` (
        \`id\`             VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`job_title\`      VARCHAR(255) NOT NULL,
        \`category\`       VARCHAR(100) NULL,
        \`location\`       VARCHAR(255) NULL,
        \`salary_avg\`     INT          NULL,
        \`salary_min\`     INT          NULL,
        \`salary_max\`     INT          NULL,
        \`sample_count\`   INT          NOT NULL DEFAULT 0,
        \`year\`           INT          NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_salary_title\`    (\`job_title\`),
        INDEX \`IDX_salary_category\` (\`category\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      "salary_data",
      "import_sources",
      "positions",
      "user_position_access",
      "role_aliases",
      "role_templates",
      "permission_matrices",
      "compensation_plans",
      "employer_timelines",
      "communication_logs",
      "audit_logs",
    ]
    for (const t of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS \`${t}\``)
    }
  }
}
