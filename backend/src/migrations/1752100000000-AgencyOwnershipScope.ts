import { MigrationInterface, QueryRunner } from "typeorm"

export class AgencyOwnershipScope1752100000000 implements MigrationInterface {
  name = "AgencyOwnershipScope1752100000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(
      queryRunner,
      "jobs",
      "team_manager_id",
      "INT NULL AFTER recruiter_id",
    )
    await this.addColumnIfMissing(
      queryRunner,
      "jobs",
      "recruitment_manager_id",
      "INT NULL AFTER team_manager_id",
    )
    await this.addIndexIfMissing(queryRunner, "jobs", "IDX_jobs_team_manager", "team_manager_id")
    await queryRunner.query(`
      UPDATE jobs j
      LEFT JOIN users u ON u.id = j.recruiter_id AND u.organization_id = j.organization_id
      SET j.team_manager_id = u.team_manager_id,
          j.recruitment_manager_id = u.recruitment_manager_id
      WHERE j.recruiter_id IS NOT NULL;
    `)

    const interviewsTable = await queryRunner.getTable("interviews")

    const legacyRecruiterColumn = interviewsTable?.findColumnByName("recruiter_id")

    const recruiterNeedsConversion = legacyRecruiterColumn?.type !== "int"

    if (recruiterNeedsConversion) {
      await this.addColumnIfMissing(
        queryRunner,
        "interviews",
        "n_recruiter_id",
        "INT NULL AFTER recruiter_id",
      )
    }

    await this.addColumnIfMissing(
      queryRunner,
      "interviews",
      "team_manager_id",
      `INT NULL AFTER ${recruiterNeedsConversion ? "n_recruiter_id" : "recruiter_id"}`,
    )
    await this.addColumnIfMissing(
      queryRunner,
      "interviews",
      "recruitment_manager_id",
      "INT NULL AFTER team_manager_id",
    )

    if (recruiterNeedsConversion) {
      await queryRunner.query(`
        UPDATE interviews i
        LEFT JOIN users by_id
          ON CONVERT(CAST(by_id.id AS CHAR) USING utf8mb4) COLLATE utf8mb4_unicode_ci
           = CONVERT(i.recruiter_id USING utf8mb4) COLLATE utf8mb4_unicode_ci
         AND by_id.organization_id = i.organization_id
        LEFT JOIN users by_email
          ON LOWER(CONVERT(by_email.email USING utf8mb4)) COLLATE utf8mb4_unicode_ci
           = LOWER(CONVERT(i.recruiter_id USING utf8mb4)) COLLATE utf8mb4_unicode_ci
         AND by_email.organization_id = i.organization_id
        SET i.n_recruiter_id = COALESCE(by_id.id, by_email.id),
            i.team_manager_id = COALESCE(by_id.team_manager_id, by_email.team_manager_id),
            i.recruitment_manager_id = COALESCE(by_id.recruitment_manager_id, by_email.recruitment_manager_id);
      `)
      await queryRunner.query(`
        ALTER TABLE interviews
          DROP COLUMN recruiter_id,
          CHANGE n_recruiter_id recruiter_id INT NULL;
      `)
    }

    await this.addIndexIfMissing(
      queryRunner,
      "interviews",
      "IDX_interviews_recruiter",
      "recruiter_id",
    )
    await this.addIndexIfMissing(
      queryRunner,
      "interviews",
      "IDX_interviews_team_manager",
      "team_manager_id",
    )

    await this.addColumnIfMissing(
      queryRunner,
      "candidate_import_batches",
      "organization_id",
      "INT NULL AFTER id",
    )
    await this.addColumnIfMissing(
      queryRunner,
      "candidate_import_batches",
      "team_manager_id",
      "INT NULL AFTER recruiter_id",
    )
    await this.addColumnIfMissing(
      queryRunner,
      "candidate_import_batches",
      "recruitment_manager_id",
      "INT NULL AFTER team_manager_id",
    )
    await this.addIndexIfMissing(
      queryRunner,
      "candidate_import_batches",
      "IDX_import_batches_org",
      "organization_id",
    )
    await this.addIndexIfMissing(
      queryRunner,
      "candidate_import_batches",
      "IDX_import_batches_team_manager",
      "team_manager_id",
    )
    await queryRunner.query(`
      UPDATE candidate_import_batches b
      LEFT JOIN users by_id ON by_id.id = b.recruiter_id
      LEFT JOIN users by_email
        ON LOWER(CONVERT(by_email.email USING utf8mb4)) COLLATE utf8mb4_unicode_ci
         = LOWER(CONVERT(b.imported_by USING utf8mb4)) COLLATE utf8mb4_unicode_ci
      SET b.organization_id = COALESCE(by_id.organization_id, by_email.organization_id),
          b.team_manager_id = COALESCE(by_id.team_manager_id, by_email.team_manager_id),
          b.recruitment_manager_id = COALESCE(by_id.recruitment_manager_id, by_email.recruitment_manager_id)
      WHERE b.organization_id IS NULL;
    `)
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    definition: string,
  ): Promise<void> {
    if (!(await queryRunner.hasColumn(tableName, columnName))) {
      await queryRunner.query(
        `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`,
      )
    }
  }

  private async addIndexIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
    columnName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName)

    if (!table?.indices.some((index) => index.name === indexName)) {
      await queryRunner.query(
        `ALTER TABLE \`${tableName}\` ADD INDEX \`${indexName}\` (\`${columnName}\`)`,
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE candidate_import_batches
        DROP INDEX IDX_import_batches_team_manager,
        DROP INDEX IDX_import_batches_org,
        DROP COLUMN recruitment_manager_id,
        DROP COLUMN team_manager_id,
        DROP COLUMN organization_id;
    `)
    await queryRunner.query(`
      ALTER TABLE interviews
        DROP INDEX IDX_interviews_team_manager,
        DROP INDEX IDX_interviews_recruiter,
        MODIFY COLUMN recruiter_id VARCHAR(255) NULL,
        DROP COLUMN recruitment_manager_id,
        DROP COLUMN team_manager_id;
    `)
    await queryRunner.query(`
      ALTER TABLE jobs
        DROP INDEX IDX_jobs_team_manager,
        DROP COLUMN recruitment_manager_id,
        DROP COLUMN team_manager_id;
    `)
  }
}
