import { In, Not } from "typeorm"
import { UserRole } from "../../common/enums/user-role.enum"
import { AuditService } from "./audit.service"

describe("AuditService OA-3 filters", () => {
  it("applies actor and date filters together with tenant scope", async () => {
    const repo = { findAndCount: jest.fn().mockResolvedValue([[], 0]) }

    const service = new AuditService(repo as any, { find: jest.fn() } as any)

    await service.findAll(
      {
        page: 1,
        limit: 20,
        sort: "created_date",
        order: "DESC",
        actor_email: "owner",
        date_from: new Date("2026-01-01"),
        date_to: new Date("2026-01-31"),
      } as any,
      { role: "org_admin", organization_id: 31 } as any,
    )
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: 31,
          actor_email: expect.anything(),
          created_date: expect.anything(),
        }),
      }),
    )
  })

  it("audits a server-side operational activity export", async () => {
    const repo = {
      findAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve(value)),
    }

    const service = new AuditService(repo as any, { find: jest.fn() } as any)

    const result = await service.export(
      { page: 1, limit: 20, sort: "created_date", order: "DESC", action: "update" } as any,
      { id: 7, email: "manager@test", role: "recruitment_manager", organization_id: 31 } as any,
    )

    expect(result.data).toHaveLength(1)
    expect(repo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ take: 500 }))
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "export",
        organization_id: "31",
        entity_type: "Organization",
        metadata: expect.objectContaining({ exported_records: 1 }),
      }),
    )
  })
})

describe("AuditService TM-3 team activity", () => {
  const teamManager = {
    id: 41,
    email: "lead@test",
    role: UserRole.TEAM_MANAGER,
    organization_id: 12,
    team_id: 4,
  }

  it("lists only events by members of the manager team", async () => {
    const repo = { findAndCount: jest.fn().mockResolvedValue([[], 0]) }

    const users = { find: jest.fn().mockResolvedValue([{ id: 41 }, { id: 7 }]) }

    const service = new AuditService(repo as any, users as any)

    await service.findAll(
      { page: 1, limit: 20, sort: "created_date", order: "DESC" } as any,
      teamManager as any,
    )

    expect(users.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organization_id: 12, team_id: 4 },
      }),
    )
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: 12,
          actor_user_id: In(["41", "7"]),
          entity_type: Not(
            In(["Organization", "PermissionMatrix", "RoleTemplate", "Billing", "Integration"]),
          ),
        }),
      }),
    )
  })

  it("does not return another team's actor or organization-wide entities", async () => {
    const repo = { findAndCount: jest.fn().mockResolvedValue([[{ id: 9 }], 1]) }

    const users = { find: jest.fn().mockResolvedValue([{ id: 41 }, { id: 7 }]) }

    const service = new AuditService(repo as any, users as any)

    const otherActor = await service.findAll(
      { page: 1, limit: 20, sort: "created_date", order: "DESC", actor_user_id: 99 } as any,
      teamManager as any,
    )

    const matrix = await service.findAll(
      {
        page: 1,
        limit: 20,
        sort: "created_date",
        order: "DESC",
        entity_type: "PermissionMatrix",
      } as any,
      teamManager as any,
    )

    expect(otherActor.data).toEqual([])
    expect(matrix.data).toEqual([])
    expect(repo.findAndCount).not.toHaveBeenCalled()
  })

  it("journals a team activity export against the team, not the organization", async () => {
    const repo = {
      findAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve(value)),
    }

    const users = { find: jest.fn().mockResolvedValue([{ id: 41 }]) }

    const service = new AuditService(repo as any, users as any)

    await service.export(
      { page: 1, limit: 20, sort: "created_date", order: "DESC" } as any,
      teamManager as any,
    )

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "export",
        entity_type: "AgencyTeam",
        entity_id: 4,
        entity_label: "Team activity export",
        metadata: expect.objectContaining({ team_id: 4, exported_records: 1 }),
      }),
    )
  })
})
