import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackgroundJobs1752500000000 implements MigrationInterface {
  name = 'BackgroundJobs1752500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE background_jobs (
        id INT NOT NULL AUTO_INCREMENT,
        type VARCHAR(80) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        idempotency_key VARCHAR(160) NOT NULL,
        payload JSON NOT NULL,
        result JSON NULL,
        error TEXT NULL,
        organization_id INT NULL,
        requested_by INT NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        run_after DATETIME NULL,
        locked_at DATETIME NULL,
        completed_at DATETIME NULL,
        created_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_date DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_background_jobs_idempotency (idempotency_key),
        KEY IDX_background_jobs_status_run_after (status, run_after),
        KEY IDX_background_jobs_organization (organization_id),
        CONSTRAINT FK_background_jobs_user FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE background_jobs');
  }
}
