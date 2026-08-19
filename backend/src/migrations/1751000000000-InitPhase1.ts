import { MigrationInterface, QueryRunner } from "typeorm"

export class InitPhase11751000000000 implements MigrationInterface {
  name = "InitPhase11751000000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── organizations ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`organizations\` (
        \`id\`            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`created_date\`  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`name\`          VARCHAR(255)  NOT NULL,
        \`org_type\`      ENUM('staffing_agency','organization') NOT NULL,
        \`status\`        ENUM('active','suspended','inactive')  NOT NULL DEFAULT 'active',
        \`settings\`      JSON          NULL,
        \`plan\`          ENUM('trial','starter','pro','enterprise') NOT NULL DEFAULT 'trial',
        \`contact_email\` VARCHAR(255)  NULL,
        \`logo_url\`      TEXT          NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_org_type\`   (\`org_type\`),
        INDEX \`IDX_org_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── users ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\`                     VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`created_date\`           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_date\`           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`email\`                  VARCHAR(255) NOT NULL,
        \`password_hash\`          VARCHAR(255) NOT NULL,
        \`full_name\`              VARCHAR(255) NULL,
        \`role\`                   ENUM(
                                     'candidate','employer','recruiter','team_manager',
                                     'recruitment_manager','org_admin','admin','super_admin',
                                     'hr_manager','internal_recruiter'
                                   ) NOT NULL DEFAULT 'candidate',
        \`organization_id\`        VARCHAR(36)  NULL,
        \`company_id\`             VARCHAR(36)  NULL,
        \`org_type\`               ENUM('staffing_agency','organization') NULL,
        \`phone\`                  VARCHAR(50)  NULL,
        \`team_manager_id\`        VARCHAR(36)  NULL,
        \`recruitment_manager_id\` VARCHAR(36)  NULL,
        \`display_role_name\`      VARCHAR(100) NULL,
        \`employer_company_id\`    VARCHAR(36)  NULL,
        \`is_active\`              TINYINT(1)   NOT NULL DEFAULT 1,
        \`last_login\`             DATETIME     NULL,
        \`refresh_token_hash\`     VARCHAR(255) NULL,
        \`reset_token_hash\`       VARCHAR(255) NULL,
        \`reset_token_expires\`    DATETIME     NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_user_email\` (\`email\`),
        INDEX \`IDX_user_org\`   (\`organization_id\`),
        INDEX \`IDX_user_role\`  (\`role\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── domains ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`domains\` (
        \`domain_id\` INT          NOT NULL,
        \`name\`      VARCHAR(255) NOT NULL,
        PRIMARY KEY (\`domain_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── taxonomy_roles ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`taxonomy_roles\` (
        \`role_id\`     INT          NOT NULL,
        \`domain_id\`   INT          NOT NULL,
        \`domain_name\` VARCHAR(255) NULL,
        \`name\`        VARCHAR(255) NOT NULL,
        PRIMARY KEY (\`role_id\`),
        INDEX \`IDX_taxrole_domain\` (\`domain_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── specializations ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`specializations\` (
        \`specialization_id\` INT          NOT NULL,
        \`role_name\`         VARCHAR(255) NOT NULL,
        \`name\`              VARCHAR(255) NOT NULL,
        PRIMARY KEY (\`specialization_id\`),
        INDEX \`IDX_spec_role_name\` (\`role_name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── work_modes ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`work_modes\` (
        \`mode_id\` INT          NOT NULL,
        \`name\`    VARCHAR(100) NOT NULL,
        PRIMARY KEY (\`mode_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── employment_types ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`employment_types\` (
        \`type_id\` INT          NOT NULL,
        \`name\`    VARCHAR(100) NOT NULL,
        PRIMARY KEY (\`type_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // ─── experience_levels ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`experience_levels\` (
        \`level_id\` INT          NOT NULL,
        \`name\`     VARCHAR(100) NOT NULL,
        PRIMARY KEY (\`level_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`experience_levels\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`employment_types\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`work_modes\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`specializations\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`taxonomy_roles\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`domains\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`organizations\``)
  }
}
