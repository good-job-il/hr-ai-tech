import { MigrationInterface, QueryRunner } from "typeorm"

export class CandidateCanonicalOwnership1752400000000 implements MigrationInterface {
  name = "CandidateCanonicalOwnership1752400000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE saved_jobs ADD COLUMN user_id INT NULL AFTER updated_date, ADD INDEX IDX_saved_jobs_user_id (user_id)`,
    )
    await queryRunner.query(
      `ALTER TABLE job_alerts ADD COLUMN user_id INT NULL AFTER updated_date, ADD INDEX IDX_job_alerts_user_id (user_id)`,
    )
    await queryRunner.query(
      `ALTER TABLE candidate_profiles ADD COLUMN user_id INT NULL AFTER updated_date, ADD UNIQUE INDEX UQ_candidate_profiles_user_id (user_id)`,
    )
    await queryRunner.query(
      `ALTER TABLE applications ADD COLUMN candidate_user_id INT NULL AFTER candidate_id, ADD INDEX IDX_applications_candidate_user_id (candidate_user_id)`,
    )
    await queryRunner.query(
      `ALTER TABLE interviews ADD COLUMN candidate_user_id INT NULL AFTER candidate_id, ADD INDEX IDX_interviews_candidate_user_id (candidate_user_id)`,
    )
    await queryRunner.query(
      `ALTER TABLE notifications ADD COLUMN recipient_user_id INT NULL AFTER recipient_email, ADD INDEX IDX_notifications_recipient_user_id (recipient_user_id)`,
    )

    await queryRunner.query(
      `UPDATE saved_jobs s INNER JOIN users u ON LOWER(u.email) = LOWER(s.user_email) SET s.user_id = u.id`,
    )
    await queryRunner.query(
      `UPDATE job_alerts a INNER JOIN users u ON LOWER(u.email) = LOWER(a.user_email) SET a.user_id = u.id`,
    )
    await queryRunner.query(
      `UPDATE candidate_profiles p INNER JOIN users u ON LOWER(u.email) = LOWER(p.user_email) SET p.user_id = u.id`,
    )
    await queryRunner.query(
      `UPDATE applications a INNER JOIN users u ON LOWER(u.email) = LOWER(a.candidate_email) SET a.candidate_user_id = u.id`,
    )
    await queryRunner.query(
      `UPDATE interviews i INNER JOIN users u ON LOWER(u.email) = LOWER(i.candidate_email) SET i.candidate_user_id = u.id`,
    )
    await queryRunner.query(
      `UPDATE notifications n INNER JOIN users u ON LOWER(u.email) = LOWER(n.recipient_email) SET n.recipient_user_id = u.id`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE notifications DROP INDEX IDX_notifications_recipient_user_id, DROP COLUMN recipient_user_id`,
    )
    await queryRunner.query(
      `ALTER TABLE interviews DROP INDEX IDX_interviews_candidate_user_id, DROP COLUMN candidate_user_id`,
    )
    await queryRunner.query(
      `ALTER TABLE applications DROP INDEX IDX_applications_candidate_user_id, DROP COLUMN candidate_user_id`,
    )
    await queryRunner.query(
      `ALTER TABLE candidate_profiles DROP INDEX UQ_candidate_profiles_user_id, DROP COLUMN user_id`,
    )
    await queryRunner.query(
      `ALTER TABLE job_alerts DROP INDEX IDX_job_alerts_user_id, DROP COLUMN user_id`,
    )
    await queryRunner.query(
      `ALTER TABLE saved_jobs DROP INDEX IDX_saved_jobs_user_id, DROP COLUMN user_id`,
    )
  }
}
