import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgencyClients1752200000000 implements MigrationInterface {
  name = 'AgencyClients1752200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE companies ADD COLUMN website VARCHAR(500) NULL AFTER logo_url`);
    await queryRunner.query(`
      CREATE TABLE agency_clients (
        id INT NOT NULL AUTO_INCREMENT,
        created_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        organization_id INT NOT NULL,
        company_id INT NOT NULL,
        status ENUM('prospect','active','inactive','archived') NOT NULL DEFAULT 'active',
        account_manager_id INT NULL,
        contact_name VARCHAR(255) NULL,
        contact_email VARCHAR(255) NULL,
        contact_phone VARCHAR(50) NULL,
        address VARCHAR(500) NULL,
        contract_type VARCHAR(100) NULL,
        contract_start_date DATE NULL,
        contract_end_date DATE NULL,
        placement_fee_percent DECIMAL(5,2) NULL,
        payment_terms_days INT NULL,
        notes TEXT NULL,
        archived_at DATETIME NULL,
        archived_by INT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX UQ_agency_client_org_company (organization_id, company_id),
        INDEX IDX_agency_client_org_status (organization_id, status),
        INDEX IDX_agency_client_company (company_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      INSERT IGNORE INTO agency_clients (organization_id, company_id, status, account_manager_id, created_date, updated_date)
      SELECT DISTINCT j.organization_id, j.employer_company_id, 'active', j.created_by_user_id, NOW(6), NOW(6)
      FROM jobs j
      INNER JOIN companies c ON c.id = j.employer_company_id AND c.is_deleted = false
      WHERE j.organization_id IS NOT NULL
        AND j.employer_company_id IS NOT NULL
        AND j.is_deleted = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE agency_clients`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN website`);
  }
}
