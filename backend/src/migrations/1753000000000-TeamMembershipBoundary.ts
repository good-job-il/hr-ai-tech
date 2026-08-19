import { MigrationInterface, QueryRunner } from "typeorm"

const TEAM_SCOPED_TABLES = [
  "jobs",
  "candidates",
  "applications",
  "interviews",
  "candidate_import_batches",
  "compensation_plans",
]

export class TeamMembershipBoundary1753000000000 implements MigrationInterface {
  name = "TeamMembershipBoundary1753000000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of TEAM_SCOPED_TABLES) {
      if (!(await queryRunner.hasColumn(tableName, "team_id"))) {
        await queryRunner.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`team_id\` INT NULL`)
      }

      const table = await queryRunner.getTable(tableName)

      const indexName = `IDX_${tableName}_team_id`

      if (!table?.indices.some(index => index.name === indexName)) {
        await queryRunner.query(`CREATE INDEX \`${indexName}\` ON \`${tableName}\` (\`team_id\`)`)
      }

      await queryRunner.query(`
        UPDATE \`${tableName}\` record
        LEFT JOIN users recruiter
          ON recruiter.id = record.recruiter_id
         AND recruiter.organization_id = record.organization_id
        LEFT JOIN agency_teams managed_team
          ON managed_team.manager_id = record.team_manager_id
         AND managed_team.organization_id = record.organization_id
        SET record.team_id = COALESCE(recruiter.team_id, managed_team.id)
        WHERE record.team_id IS NULL
      `)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of [...TEAM_SCOPED_TABLES].reverse()) {
      const table = await queryRunner.getTable(tableName)

      const indexName = `IDX_${tableName}_team_id`

      if (table?.indices.some(index => index.name === indexName)) {
        await queryRunner.query(`DROP INDEX \`${indexName}\` ON \`${tableName}\``)
      }

      if (await queryRunner.hasColumn(tableName, "team_id")) {
        await queryRunner.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`team_id\``)
      }
    }
  }
}
