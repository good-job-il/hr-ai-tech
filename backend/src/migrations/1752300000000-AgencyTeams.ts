import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgencyTeams1752300000000 implements MigrationInterface {
  name = 'AgencyTeams1752300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE agency_teams (
        id INT NOT NULL AUTO_INCREMENT,
        created_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        organization_id INT NOT NULL,
        name VARCHAR(120) NOT NULL,
        description TEXT NULL,
        manager_id INT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        PRIMARY KEY (id),
        UNIQUE INDEX UQ_agency_team_org_name (organization_id, name),
        INDEX IDX_agency_team_org (organization_id),
        INDEX IDX_agency_team_manager (manager_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`ALTER TABLE users ADD COLUMN team_id INT NULL AFTER team_manager_id`);
    await queryRunner.query(`CREATE INDEX IDX_users_team_id ON users (team_id)`);
    await queryRunner.query(`
      CREATE TABLE agency_invitations (
        id INT NOT NULL AUTO_INCREMENT,
        created_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        organization_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        role ENUM('candidate','employer','recruiter','team_manager','recruitment_manager','org_admin','admin','hr_manager','internal_recruiter') NOT NULL,
        team_id INT NULL,
        token_hash VARCHAR(64) NOT NULL,
        status ENUM('pending','accepted','cancelled','expired') NOT NULL DEFAULT 'pending',
        invited_by INT NOT NULL,
        expires_at DATETIME NOT NULL,
        accepted_at DATETIME NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX UQ_agency_invitation_token (token_hash),
        INDEX IDX_agency_invitation_org_status (organization_id, status),
        INDEX IDX_agency_invitation_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`ALTER TABLE audit_logs MODIFY COLUMN entity_type ENUM('Candidate','Application','Job','Company','CandidateDocument','CompensationPlan','User','Organization','Interview','CommunicationLog','AgencyTeam','AgencyInvitation') NOT NULL`);
    await queryRunner.query(`ALTER TABLE audit_logs MODIFY COLUMN action ENUM('view','create','update','delete','cv_download','cv_view','status_change','send_to_employer','export','compensation_change','login','impersonate','restore','role_display_name_update','permission_update','deactivate','resend','cancel') NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE audit_logs MODIFY COLUMN action ENUM('view','create','update','delete','cv_download','cv_view','status_change','send_to_employer','export','compensation_change','login','impersonate','restore','role_display_name_update','permission_update') NOT NULL`);
    await queryRunner.query(`ALTER TABLE audit_logs MODIFY COLUMN entity_type ENUM('Candidate','Application','Job','Company','CandidateDocument','CompensationPlan','User','Organization','Interview','CommunicationLog') NOT NULL`);
    await queryRunner.query(`DROP TABLE agency_invitations`);
    await queryRunner.query(`DROP INDEX IDX_users_team_id ON users`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN team_id`);
    await queryRunner.query(`DROP TABLE agency_teams`);
  }
}
