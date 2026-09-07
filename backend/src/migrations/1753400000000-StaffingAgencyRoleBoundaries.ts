import { MigrationInterface, QueryRunner } from "typeorm"

export class StaffingAgencyRoleBoundaries1753400000000 implements MigrationInterface {
  name = "StaffingAgencyRoleBoundaries1753400000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users
      INNER JOIN organizations ON organizations.id = users.organization_id
      SET users.org_type = organizations.org_type
      WHERE users.org_type IS NULL OR users.org_type <> organizations.org_type
    `)

    const duplicateLeadershipRoles = (await queryRunner.query(`
      SELECT users.organization_id, users.role
      FROM users
      INNER JOIN organizations ON organizations.id = users.organization_id
      WHERE organizations.org_type = 'staffing_agency'
        AND users.role IN ('org_admin', 'recruitment_manager')
      GROUP BY users.organization_id, users.role
      HAVING COUNT(*) > 1
      LIMIT 1
    `)) as Array<{ organization_id: number; role: string }>

    if (duplicateLeadershipRoles.length > 0) {
      throw new Error(
        "Cannot enforce staffing agency leadership limits: duplicate organization admins or recruitment managers exist",
      )
    }

    const duplicateTeamManagers = (await queryRunner.query(`
      SELECT manager_id
      FROM agency_teams
      WHERE manager_id IS NOT NULL
      GROUP BY manager_id
      HAVING COUNT(*) > 1
      LIMIT 1
    `)) as Array<{ manager_id: number }>

    if (duplicateTeamManagers.length > 0) {
      throw new Error(
        "Cannot enforce team manager ownership: a team manager is assigned to multiple teams",
      )
    }

    const duplicatePendingLeadershipInvites = (await queryRunner.query(`
      SELECT organization_id, role
      FROM agency_invitations
      WHERE status = 'pending'
        AND role IN ('org_admin', 'recruitment_manager')
      GROUP BY organization_id, role
      HAVING COUNT(*) > 1
      LIMIT 1
    `)) as Array<{ organization_id: number; role: string }>

    if (duplicatePendingLeadershipInvites.length > 0) {
      throw new Error(
        "Cannot enforce staffing agency invitation limits: duplicate pending leadership invitations exist",
      )
    }

    if (!(await queryRunner.hasColumn("users", "staffing_org_admin_slot"))) {
      await queryRunner.query(`
        ALTER TABLE users
        ADD COLUMN staffing_org_admin_slot INT
          GENERATED ALWAYS AS (
            CASE
              WHEN org_type = 'staffing_agency' AND role = 'org_admin' THEN organization_id
              ELSE NULL
            END
          ) STORED,
        ADD UNIQUE INDEX UQ_users_staffing_org_admin (staffing_org_admin_slot)
      `)
    }

    if (!(await queryRunner.hasColumn("users", "staffing_recruitment_manager_slot"))) {
      await queryRunner.query(`
        ALTER TABLE users
        ADD COLUMN staffing_recruitment_manager_slot INT
          GENERATED ALWAYS AS (
            CASE
              WHEN org_type = 'staffing_agency' AND role = 'recruitment_manager' THEN organization_id
              ELSE NULL
            END
          ) STORED,
        ADD UNIQUE INDEX UQ_users_staffing_recruitment_manager (staffing_recruitment_manager_slot)
      `)
    }

    if (!(await queryRunner.hasColumn("agency_invitations", "pending_org_admin_slot"))) {
      await queryRunner.query(`
        ALTER TABLE agency_invitations
        ADD COLUMN pending_org_admin_slot INT
          GENERATED ALWAYS AS (
            CASE WHEN status = 'pending' AND role = 'org_admin' THEN organization_id ELSE NULL END
          ) STORED,
        ADD UNIQUE INDEX UQ_invitation_pending_org_admin (pending_org_admin_slot)
      `)
    }

    if (!(await queryRunner.hasColumn("agency_invitations", "pending_recruitment_manager_slot"))) {
      await queryRunner.query(`
        ALTER TABLE agency_invitations
        ADD COLUMN pending_recruitment_manager_slot INT
          GENERATED ALWAYS AS (
            CASE
              WHEN status = 'pending' AND role = 'recruitment_manager' THEN organization_id
              ELSE NULL
            END
          ) STORED,
        ADD UNIQUE INDEX UQ_invitation_pending_recruitment_manager (pending_recruitment_manager_slot)
      `)
    }

    const teams = await queryRunner.getTable("agency_teams")

    const hasUniqueManagerIndex = teams?.indices.some(
      (index) =>
        index.isUnique && index.columnNames.length === 1 && index.columnNames[0] === "manager_id",
    )

    if (!hasUniqueManagerIndex) {
      await queryRunner.query(
        `CREATE UNIQUE INDEX UQ_agency_team_manager ON agency_teams (manager_id)`,
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const teams = await queryRunner.getTable("agency_teams")

    if (teams?.indices.some((index) => index.name === "UQ_agency_team_manager")) {
      await queryRunner.query(`DROP INDEX UQ_agency_team_manager ON agency_teams`)
    }

    if (await queryRunner.hasColumn("agency_invitations", "pending_recruitment_manager_slot")) {
      await queryRunner.query(
        `ALTER TABLE agency_invitations DROP INDEX UQ_invitation_pending_recruitment_manager, DROP COLUMN pending_recruitment_manager_slot`,
      )
    }

    if (await queryRunner.hasColumn("agency_invitations", "pending_org_admin_slot")) {
      await queryRunner.query(
        `ALTER TABLE agency_invitations DROP INDEX UQ_invitation_pending_org_admin, DROP COLUMN pending_org_admin_slot`,
      )
    }

    if (await queryRunner.hasColumn("users", "staffing_recruitment_manager_slot")) {
      await queryRunner.query(
        `ALTER TABLE users DROP INDEX UQ_users_staffing_recruitment_manager, DROP COLUMN staffing_recruitment_manager_slot`,
      )
    }

    if (await queryRunner.hasColumn("users", "staffing_org_admin_slot")) {
      await queryRunner.query(
        `ALTER TABLE users DROP INDEX UQ_users_staffing_org_admin, DROP COLUMN staffing_org_admin_slot`,
      )
    }
  }
}
