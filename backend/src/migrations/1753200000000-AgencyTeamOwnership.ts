import { MigrationInterface, QueryRunner } from "typeorm"

export class AgencyTeamOwnership1753200000000 implements MigrationInterface {
  name = "AgencyTeamOwnership1753200000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE agency_teams ADD COLUMN recruitment_manager_id INT NULL AFTER manager_id`,
    )
    await queryRunner.query(
      `CREATE INDEX IDX_agency_team_recruitment_manager ON agency_teams (recruitment_manager_id)`,
    )
    await queryRunner.query(`
      UPDATE agency_teams team
      JOIN users manager ON manager.id = team.manager_id
      SET team.recruitment_manager_id = manager.recruitment_manager_id
      WHERE manager.recruitment_manager_id IS NOT NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_agency_team_recruitment_manager ON agency_teams`)
    await queryRunner.query(`ALTER TABLE agency_teams DROP COLUMN recruitment_manager_id`)
  }
}
