import { MigrationInterface, QueryRunner } from "typeorm"

export class Phase21751100000000 implements MigrationInterface {
  name = "Phase21751100000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── candidates ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`candidates\` (
        \`id\`                        VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`created_date\`              DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`              DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`           VARCHAR(36)   NULL,
        \`full_name\`                 VARCHAR(255)  NOT NULL,
        \`email\`                     VARCHAR(255)  NULL,
        \`phone\`                     VARCHAR(50)   NULL,
        \`location\`                  VARCHAR(255)  NULL,
        \`domain_id\`                 INT           NULL,
        \`domain_name\`               VARCHAR(255)  NULL,
        \`role_id\`                   INT           NULL,
        \`role_name\`                 VARCHAR(255)  NULL,
        \`specialization_id\`         INT           NULL,
        \`specialization_name\`       VARCHAR(255)  NULL,
        \`experience_years\`          DECIMAL(4,1)  NULL,
        \`desired_salary_min\`        INT           NULL,
        \`desired_salary_max\`        INT           NULL,
        \`resume_url\`                TEXT          NULL,
        \`original_resume_url\`       TEXT          NULL,
        \`converted_resume_url\`      TEXT          NULL,
        \`resume_filename\`           VARCHAR(500)  NULL,
        \`original_file_type\`        ENUM('pdf','doc','docx','txt') NULL,
        \`converted_file_type\`       VARCHAR(10)   NULL DEFAULT 'docx',
        \`converted_resume_filename\` VARCHAR(500)  NULL,
        \`original_resume_filename\`  VARCHAR(500)  NULL,
        \`resume_file_size\`          BIGINT        NULL,
        \`resume_uploaded_at\`        DATETIME      NULL,
        \`resume_upload_source\`      ENUM('manual','import_zip','api','crawl') NULL DEFAULT 'manual',
        \`source\`                    ENUM('import','manual','linkedin','upload','crawl') NULL DEFAULT 'manual',
        \`status\`                    ENUM('new','contacted','interview','offer','hired','rejected','inactive') NOT NULL DEFAULT 'new',
        \`recruiter_id\`              VARCHAR(36)   NULL,
        \`team_manager_id\`           VARCHAR(36)   NULL,
        \`recruitment_manager_id\`    VARCHAR(36)   NULL,
        \`employer_company_id\`       VARCHAR(36)   NULL,
        \`agency_company_id\`         VARCHAR(36)   NULL,
        \`skills\`                    JSON          NULL,
        \`languages\`                 JSON          NULL,
        \`previous_companies\`        JSON          NULL,
        \`summary\`                   TEXT          NULL,
        \`notes\`                     TEXT          NULL,
        \`is_duplicate_suspected\`    TINYINT(1)    NOT NULL DEFAULT 0,
        \`duplicate_of_id\`           VARCHAR(36)   NULL,
        \`import_batch_id\`           VARCHAR(36)   NULL,
        \`data_quality_score\`        INT           NOT NULL DEFAULT 0,
        \`missing_data\`              JSON          NULL,
        \`parsing_status\`            ENUM('pending','success','partial','failed') NOT NULL DEFAULT 'pending',
        \`parsing_confidence\`        INT           NOT NULL DEFAULT 0,
        \`conversion_status\`         ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
        \`review_required\`           TINYINT(1)    NOT NULL DEFAULT 0,
        \`imported_at\`               DATETIME      NULL,
        \`imported_by\`               VARCHAR(255)  NULL,
        \`is_deleted\`                TINYINT(1)    NOT NULL DEFAULT 0,
        \`deleted_at\`                DATETIME      NULL,
        \`deleted_by\`                VARCHAR(36)   NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_cand_org\`        (\`organization_id\`),
        INDEX \`IDX_cand_recruiter\`  (\`recruiter_id\`),
        INDEX \`IDX_cand_team_mgr\`   (\`team_manager_id\`),
        INDEX \`IDX_cand_status\`     (\`status\`),
        INDEX \`IDX_cand_email\`      (\`email\`),
        INDEX \`IDX_cand_deleted\`    (\`is_deleted\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── candidate_notes ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`candidate_notes\` (
        \`id\`                     VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`        VARCHAR(36)  NULL,
        \`candidate_id\`           VARCHAR(36)  NOT NULL,
        \`candidate_email\`        VARCHAR(255) NULL,
        \`author_email\`           VARCHAR(255) NOT NULL,
        \`author_name\`            VARCHAR(255) NULL,
        \`author_role\`            VARCHAR(100) NULL,
        \`content\`                TEXT         NOT NULL,
        \`visibility\`             ENUM('private','team','all') NULL DEFAULT 'team',
        \`is_pinned\`              TINYINT(1)   NOT NULL DEFAULT 0,
        \`note_type\`              VARCHAR(50)  NULL,
        \`related_application_id\` VARCHAR(36)  NULL,
        \`related_interview_id\`   VARCHAR(36)  NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_note_cand\` (\`candidate_id\`),
        INDEX \`IDX_note_org\`  (\`organization_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── candidate_tags ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`candidate_tags\` (
        \`id\`           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`candidate_id\` VARCHAR(36)  NOT NULL,
        \`tag\`          VARCHAR(100) NOT NULL,
        \`color\`        VARCHAR(20)  NULL,
        \`added_by\`     VARCHAR(255) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_tag_cand\` (\`candidate_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── candidate_documents ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`candidate_documents\` (
        \`id\`                 VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`    VARCHAR(36)  NULL,
        \`candidate_id\`       VARCHAR(36)  NOT NULL,
        \`candidate_email\`    VARCHAR(255) NULL,
        \`doc_type\`           VARCHAR(50)  NOT NULL,
        \`filename\`           VARCHAR(500) NULL,
        \`file_url\`           TEXT         NOT NULL,
        \`original_file_url\`  TEXT         NULL,
        \`original_file_type\` VARCHAR(20)  NULL,
        \`original_filename\`  VARCHAR(500) NULL,
        \`docx_url\`           TEXT         NULL,
        \`docx_filename\`      VARCHAR(500) NULL,
        \`file_size\`          BIGINT       NULL,
        \`uploaded_by\`        VARCHAR(255) NULL,
        \`uploaded_at\`        DATETIME     NULL,
        \`is_latest_cv\`       TINYINT(1)   NOT NULL DEFAULT 0,
        \`conversion_status\`  ENUM('pending','success','failed') NULL DEFAULT 'pending',
        \`conversion_error\`   TEXT         NULL,
        \`parsing_status\`     ENUM('pending','success','partial','failed') NULL DEFAULT 'pending',
        \`parsing_error\`      TEXT         NULL,
        \`parsed_data\`        JSON         NULL,
        \`import_batch_id\`    VARCHAR(36)  NULL,
        \`notes\`              TEXT         NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_doc_cand\` (\`candidate_id\`),
        INDEX \`IDX_doc_org\`  (\`organization_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── candidate_timelines ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`candidate_timelines\` (
        \`id\`                       VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`             DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`             DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`          VARCHAR(36)  NULL,
        \`candidate_id\`             VARCHAR(36)  NOT NULL,
        \`candidate_email\`          VARCHAR(255) NULL,
        \`event_type\`               VARCHAR(100) NOT NULL,
        \`description\`              TEXT         NOT NULL,
        \`performed_by\`             VARCHAR(255) NULL,
        \`performed_by_name\`        VARCHAR(255) NULL,
        \`performed_by_role\`        VARCHAR(100) NULL,
        \`metadata\`                 JSON         NULL,
        \`is_visible_to_candidate\`  TINYINT(1)   NOT NULL DEFAULT 0,
        \`is_visible_to_employer\`   TINYINT(1)   NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_ctl_cand\` (\`candidate_id\`),
        INDEX \`IDX_ctl_org\`  (\`organization_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── candidate_import_batches ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`candidate_import_batches\` (
        \`id\`                       VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`             DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`             DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`batch_name\`               VARCHAR(255) NOT NULL,
        \`source_file\`              VARCHAR(500) NULL,
        \`file_type\`                VARCHAR(20)  NOT NULL,
        \`imported_by\`              VARCHAR(255) NOT NULL,
        \`employer_id\`              VARCHAR(36)  NULL,
        \`recruiter_id\`             VARCHAR(36)  NULL,
        \`total_records\`            INT          NOT NULL DEFAULT 0,
        \`successful_imports\`       INT          NOT NULL DEFAULT 0,
        \`failed_imports\`           INT          NOT NULL DEFAULT 0,
        \`duplicate_found\`          INT          NOT NULL DEFAULT 0,
        \`review_required\`          INT          NOT NULL DEFAULT 0,
        \`missing_email\`            INT          NOT NULL DEFAULT 0,
        \`missing_phone\`            INT          NOT NULL DEFAULT 0,
        \`missing_role\`             INT          NOT NULL DEFAULT 0,
        \`missing_resume\`           INT          NOT NULL DEFAULT 0,
        \`conversion_failures\`      INT          NOT NULL DEFAULT 0,
        \`parsing_failures\`         INT          NOT NULL DEFAULT 0,
        \`status\`                   ENUM('pending','processing','completed','failed','partial') NOT NULL DEFAULT 'pending',
        \`error_log\`                JSON         NULL,
        \`processing_started_at\`    DATETIME     NULL,
        \`processing_completed_at\`  DATETIME     NULL,
        \`summary\`                  TEXT         NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── candidate_profiles ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`candidate_profiles\` (
        \`id\`                  VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`user_email\`          VARCHAR(255) NOT NULL UNIQUE,
        \`full_name\`           VARCHAR(255) NOT NULL,
        \`phone\`               VARCHAR(50)  NULL,
        \`location\`            VARCHAR(255) NULL,
        \`title\`               VARCHAR(255) NULL,
        \`summary\`             TEXT         NULL,
        \`skills\`              JSON         NULL,
        \`experience_years\`    DECIMAL(4,1) NULL,
        \`education\`           JSON         NULL,
        \`experience\`          JSON         NULL,
        \`desired_salary_min\`  INT          NULL,
        \`desired_salary_max\`  INT          NULL,
        \`job_type\`            VARCHAR(50)  NULL,
        \`categories\`          JSON         NULL,
        \`is_public\`           TINYINT(1)   NOT NULL DEFAULT 0,
        \`is_open_to_work\`     TINYINT(1)   NOT NULL DEFAULT 0,
        \`resume_url\`          TEXT         NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_profile_email\` (\`user_email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── candidate_access ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`candidate_access\` (
        \`id\`                       VARCHAR(36) NOT NULL DEFAULT (UUID()),
        \`created_date\`             DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`             DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`candidate_id\`             VARCHAR(36) NOT NULL,
        \`owner_organization_id\`    VARCHAR(36) NOT NULL,
        \`accessor_organization_id\` VARCHAR(36) NULL,
        \`access_type\`              ENUM('owner','shared','purchased') NOT NULL DEFAULT 'owner',
        \`granted_by\`               VARCHAR(36) NULL,
        \`granted_at\`               DATETIME    NULL,
        \`expires_at\`               DATETIME    NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_access_cand\` (\`candidate_id\`),
        INDEX \`IDX_access_owner\` (\`owner_organization_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── jobs ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`jobs\` (
        \`id\`                    VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`       VARCHAR(36)  NULL,
        \`domain_id\`             INT          NULL,
        \`role_id\`               INT          NULL,
        \`specialization_id\`     INT          NULL,
        \`title\`                 VARCHAR(255) NOT NULL,
        \`company\`               VARCHAR(255) NOT NULL,
        \`company_initials\`      VARCHAR(10)  NULL,
        \`company_color\`         VARCHAR(20)  NULL,
        \`location\`              VARCHAR(255) NULL,
        \`salary_min\`            INT          NULL,
        \`salary_max\`            INT          NULL,
        \`category\`              VARCHAR(100) NULL,
        \`type\`                  ENUM('full','part','daily','remote') NOT NULL DEFAULT 'full',
        \`views\`                 INT          NOT NULL DEFAULT 0,
        \`description\`           LONGTEXT     NULL,
        \`employer_company_id\`   VARCHAR(36)  NULL,
        \`agency_company_id\`     VARCHAR(36)  NULL,
        \`created_by_user_id\`    VARCHAR(36)  NULL,
        \`recruiter_id\`          VARCHAR(36)  NULL,
        \`employer_id\`           VARCHAR(255) NULL,
        \`external_id\`           VARCHAR(255) NULL,
        \`is_closed\`             TINYINT(1)   NOT NULL DEFAULT 0,
        \`is_anonymous\`          TINYINT(1)   NOT NULL DEFAULT 0,
        \`show_company_name\`     TINYINT(1)   NOT NULL DEFAULT 1,
        \`show_company_info\`     TINYINT(1)   NOT NULL DEFAULT 1,
        \`show_contact_details\`  TINYINT(1)   NOT NULL DEFAULT 0,
        \`contact_email\`         VARCHAR(255) NULL,
        \`contact_phone\`         VARCHAR(50)  NULL,
        \`applications_count\`    INT          NOT NULL DEFAULT 0,
        \`required_skills\`       JSON         NULL,
        \`preferred_skills\`      JSON         NULL,
        \`role_domain\`           VARCHAR(255) NULL,
        \`seniority\`             ENUM('junior','mid','senior','lead','manager','director','any') NULL DEFAULT 'any',
        \`years_experience_required\` INT      NULL,
        \`ai_keywords\`           JSON         NULL,
        \`job_code\`              VARCHAR(50)  NULL UNIQUE,
        \`apply_email\`           VARCHAR(255) NULL,
        \`apply_url\`             TEXT         NULL,
        \`is_deleted\`            TINYINT(1)   NOT NULL DEFAULT 0,
        \`deleted_at\`            DATETIME     NULL,
        \`deleted_by\`            VARCHAR(36)  NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_job_org\`      (\`organization_id\`),
        INDEX \`IDX_job_recruiter\` (\`recruiter_id\`),
        INDEX \`IDX_job_closed\`   (\`is_closed\`),
        INDEX \`IDX_job_deleted\`  (\`is_deleted\`),
        INDEX \`IDX_job_domain\`   (\`domain_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── saved_jobs ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`saved_jobs\` (
        \`id\`           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`user_email\`   VARCHAR(255) NOT NULL,
        \`job_id\`       VARCHAR(36)  NOT NULL,
        \`job_title\`    VARCHAR(255) NULL,
        \`company\`      VARCHAR(255) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_sj_email\` (\`user_email\`),
        INDEX \`IDX_sj_job\`   (\`job_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── job_alerts ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`job_alerts\` (
        \`id\`           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`user_email\`   VARCHAR(255) NOT NULL,
        \`keywords\`     VARCHAR(500) NULL,
        \`location\`     VARCHAR(255) NULL,
        \`category\`     VARCHAR(100) NULL,
        \`job_type\`     VARCHAR(50)  NULL,
        \`salary_min\`   INT          NULL,
        \`frequency\`    ENUM('daily','weekly','instant') NULL DEFAULT 'weekly',
        \`is_active\`    TINYINT(1)   NOT NULL DEFAULT 1,
        \`last_sent\`    DATETIME     NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_alert_email\`  (\`user_email\`),
        INDEX \`IDX_alert_active\` (\`is_active\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── applications ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`applications\` (
        \`id\`                     VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`        VARCHAR(36)  NULL,
        \`job_id\`                 VARCHAR(36)  NOT NULL,
        \`candidate_id\`           VARCHAR(36)  NULL,
        \`job_title\`              VARCHAR(255) NULL,
        \`company\`                VARCHAR(255) NULL,
        \`employer_company_id\`    VARCHAR(36)  NULL,
        \`agency_company_id\`      VARCHAR(36)  NULL,
        \`recruiter_id\`           VARCHAR(36)  NULL,
        \`team_manager_id\`        VARCHAR(36)  NULL,
        \`recruitment_manager_id\` VARCHAR(36)  NULL,
        \`candidate_name\`         VARCHAR(255) NOT NULL,
        \`candidate_email\`        VARCHAR(255) NOT NULL,
        \`candidate_phone\`        VARCHAR(50)  NULL,
        \`resume_url\`             TEXT         NULL,
        \`resume_filename\`        VARCHAR(500) NULL,
        \`cover_letter\`           TEXT         NULL,
        \`desired_salary_min\`     INT          NULL,
        \`desired_salary_max\`     INT          NULL,
        \`location\`               VARCHAR(255) NULL,
        \`source\`                 ENUM('app','linkedin','facebook','jobsite','pool_assignment','email_intake','other') NULL DEFAULT 'app',
        \`status\`                 ENUM('new','reviewed','phone_interview','recommended','employer_interview','offer','hired','probation','completed','rejected') NOT NULL DEFAULT 'new',
        \`match_score\`            DECIMAL(5,2) NULL,
        \`match_reason\`           TEXT         NULL,
        \`notes\`                  TEXT         NULL,
        \`internal_history\`       TEXT         NULL,
        \`assigned_to\`            VARCHAR(36)  NULL,
        \`employer_id\`            VARCHAR(255) NULL,
        \`is_deleted\`             TINYINT(1)   NOT NULL DEFAULT 0,
        \`deleted_at\`             DATETIME     NULL,
        \`deleted_by\`             VARCHAR(36)  NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_app_org\`       (\`organization_id\`),
        INDEX \`IDX_app_job\`       (\`job_id\`),
        INDEX \`IDX_app_cand\`      (\`candidate_id\`),
        INDEX \`IDX_app_recruiter\` (\`recruiter_id\`),
        INDEX \`IDX_app_status\`    (\`status\`),
        INDEX \`IDX_app_deleted\`   (\`is_deleted\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── application_timelines ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`application_timelines\` (
        \`id\`               VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`  VARCHAR(36)  NULL,
        \`application_id\`   VARCHAR(36)  NOT NULL,
        \`event_type\`       ENUM('submitted','status_changed','note_added','interview_scheduled','interview_completed','offer_made','rejected','assigned','resume_viewed') NOT NULL,
        \`previous_value\`   VARCHAR(100) NULL,
        \`new_value\`        VARCHAR(100) NULL,
        \`description\`      TEXT         NOT NULL,
        \`performed_by\`     VARCHAR(255) NULL,
        \`performed_by_role\` ENUM('candidate','employer','recruiter','team_manager','recruitment_manager','org_admin','admin') NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_atl_app\` (\`application_id\`),
        INDEX \`IDX_atl_org\` (\`organization_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── application_pipelines ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`application_pipelines\` (
        \`id\`           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`employer_id\`  VARCHAR(255) NOT NULL,
        \`name\`         VARCHAR(100) NOT NULL,
        \`order\`        INT          NOT NULL DEFAULT 0,
        \`color\`        VARCHAR(20)  NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_pipeline_employer\` (\`employer_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── interviews ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`interviews\` (
        \`id\`                  VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`     VARCHAR(36)  NULL,
        \`application_id\`      VARCHAR(36)  NULL,
        \`candidate_id\`        VARCHAR(36)  NULL,
        \`job_id\`              VARCHAR(36)  NULL,
        \`job_title\`           VARCHAR(255) NULL,
        \`employer_id\`         VARCHAR(255) NULL,
        \`recruiter_id\`        VARCHAR(255) NULL,
        \`candidate_name\`      VARCHAR(255) NOT NULL,
        \`candidate_email\`     VARCHAR(255) NULL,
        \`date\`                DATE         NOT NULL,
        \`time\`                VARCHAR(10)  NOT NULL,
        \`duration_minutes\`    INT          NOT NULL DEFAULT 45,
        \`type\`                ENUM('phone','video','in_person','technical','hr','final') NOT NULL DEFAULT 'video',
        \`stage\`               ENUM('screening','first','second','third','technical','hr','final','offer') NULL DEFAULT 'first',
        \`location_or_link\`    TEXT         NULL,
        \`interviewer_name\`    VARCHAR(255) NULL,
        \`interviewer_email\`   VARCHAR(255) NULL,
        \`notes\`               TEXT         NULL,
        \`feedback\`            TEXT         NULL,
        \`rating\`              DECIMAL(3,1) NULL,
        \`recommendation\`      ENUM('strong_yes','yes','maybe','no','strong_no') NULL,
        \`status\`              ENUM('scheduled','confirmed','completed','cancelled','no_show','rescheduled') NOT NULL DEFAULT 'scheduled',
        \`reminder_sent\`       TINYINT(1)   NOT NULL DEFAULT 0,
        \`candidate_confirmed\` TINYINT(1)   NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_ivw_org\`   (\`organization_id\`),
        INDEX \`IDX_ivw_app\`   (\`application_id\`),
        INDEX \`IDX_ivw_cand\`  (\`candidate_id\`),
        INDEX \`IDX_ivw_recr\`  (\`recruiter_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── messages ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`messages\` (
        \`id\`             VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`application_id\` VARCHAR(36)  NOT NULL,
        \`sender_email\`   VARCHAR(255) NOT NULL,
        \`sender_role\`    ENUM('employer','candidate','recruiter') NULL,
        \`content\`        TEXT         NOT NULL,
        \`is_read\`        TINYINT(1)   NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_msg_app\`    (\`application_id\`),
        INDEX \`IDX_msg_sender\` (\`sender_email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── notifications ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\`               VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`organization_id\`  VARCHAR(36)  NULL,
        \`recipient_email\`  VARCHAR(255) NOT NULL,
        \`type\`             ENUM('new_application','interview_scheduled','message','job_closed','job_match','interview_reminder') NOT NULL,
        \`title\`            VARCHAR(255) NOT NULL,
        \`content\`          TEXT         NULL,
        \`metadata\`         JSON         NULL,
        \`is_read\`          TINYINT(1)   NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_notif_org\`   (\`organization_id\`),
        INDEX \`IDX_notif_email\` (\`recipient_email\`),
        INDEX \`IDX_notif_read\`  (\`is_read\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── companies ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`companies\` (
        \`id\`           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`name\`         VARCHAR(255) NOT NULL,
        \`industry\`     VARCHAR(100) NULL,
        \`initials\`     VARCHAR(10)  NULL,
        \`color\`        VARCHAR(20)  NULL,
        \`logo_url\`     TEXT         NULL,
        \`job_count\`    INT          NOT NULL DEFAULT 0,
        \`is_deleted\`   TINYINT(1)   NOT NULL DEFAULT 0,
        \`deleted_at\`   DATETIME     NULL,
        \`deleted_by\`   VARCHAR(36)  NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_company_name\`    (\`name\`),
        INDEX \`IDX_company_deleted\` (\`is_deleted\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── company_reviews ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`company_reviews\` (
        \`id\`                VARCHAR(36)    NOT NULL DEFAULT (UUID()),
        \`created_date\`      DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`      DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`company_id\`        VARCHAR(36)    NOT NULL,
        \`company_name\`      VARCHAR(255)   NULL,
        \`reviewer_email\`    VARCHAR(255)   NOT NULL,
        \`reviewer_name\`     VARCHAR(255)   NULL,
        \`rating_overall\`    DECIMAL(3,1)   NOT NULL,
        \`rating_salary\`     DECIMAL(3,1)   NULL,
        \`rating_management\` DECIMAL(3,1)   NULL,
        \`rating_worklife\`   DECIMAL(3,1)   NULL,
        \`title\`             VARCHAR(255)   NULL,
        \`pros\`              TEXT           NULL,
        \`cons\`              TEXT           NULL,
        \`is_anonymous\`      TINYINT(1)     NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_review_company\`  (\`company_id\`),
        INDEX \`IDX_review_reviewer\` (\`reviewer_email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── staff ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`staff\` (
        \`id\`            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`company_id\`    VARCHAR(255) NOT NULL,
        \`full_name\`     VARCHAR(255) NOT NULL,
        \`email\`         VARCHAR(255) NOT NULL,
        \`phone\`         VARCHAR(50)  NOT NULL,
        \`role\`          ENUM('hiring_manager','team_manager','recruiter') NOT NULL,
        \`manager_email\` VARCHAR(255) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_staff_company\` (\`company_id\`),
        INDEX \`IDX_staff_email\`   (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      "staff",
      "company_reviews",
      "companies",
      "notifications",
      "messages",
      "interviews",
      "application_pipelines",
      "application_timelines",
      "applications",
      "job_alerts",
      "saved_jobs",
      "jobs",
      "candidate_access",
      "candidate_profiles",
      "candidate_import_batches",
      "candidate_timelines",
      "candidate_documents",
      "candidate_tags",
      "candidate_notes",
      "candidates",
    ]
    for (const t of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS \`${t}\``)
    }
  }
}
