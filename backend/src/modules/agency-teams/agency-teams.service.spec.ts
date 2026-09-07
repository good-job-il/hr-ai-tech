import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { UserRole } from "../../common/enums/user-role.enum"
import { AgencyTeamsService } from "./agency-teams.service"

describe("AgencyTeamsService OA-4 team lifecycle acceptance", () => {
  const organizationId = 71

  const actor = {
    id: 1,
    email: "owner@acceptance.test",
    full_name: "Agency Owner",
    role: UserRole.ORG_ADMIN,
    organization_id: organizationId,
  } as any

  let storedUsers: any[]

  let storedTeams: any[]

  let storedInvitations: any[]

  let service: AgencyTeamsService

  beforeEach(() => {
    storedUsers = [actor]
    storedTeams = []
    storedInvitations = []

    const users = {
      findOne: jest.fn(
        async ({ where }) =>
          storedUsers.find((item) =>
            Object.entries(where).every(([key, value]) => item[key] === value),
          ) || null,
      ),
      save: jest.fn(async (value) => {
        const saved = { id: value.id || storedUsers.length + 1, ...value }

        storedUsers = [...storedUsers.filter((item) => item.id !== saved.id), saved]

        return saved
      }),
      create: jest.fn((value) => value),
      update: jest.fn(async (criteria, patch) => {
        const where = typeof criteria === "number" ? { id: criteria } : criteria

        storedUsers = storedUsers.map((item) =>
          Object.entries(where).every(([key, value]) => item[key] === value)
            ? { ...item, ...patch }
            : item,
        )

        return { affected: 1 }
      }),
      count: jest.fn(
        async ({ where }) =>
          storedUsers.filter((item) =>
            Object.entries(where).every(([key, value]) => item[key] === value),
          ).length,
      ),
      find: jest.fn(async () => storedUsers),
    }

    const teams = {
      findOne: jest.fn(
        async ({ where }) =>
          storedTeams.find((item) =>
            Object.entries(where).every(([key, value]) => item[key] === value),
          ) || null,
      ),
      save: jest.fn(async (value) => {
        const saved = { id: value.id || storedTeams.length + 101, is_active: true, ...value }

        storedTeams = [...storedTeams.filter((item) => item.id !== saved.id), saved]

        return saved
      }),
      create: jest.fn((value) => value),
      count: jest.fn(
        async ({ where }) =>
          storedTeams.filter((item) =>
            Object.entries(where).every(([key, value]) => item[key] === value),
          ).length,
      ),
      find: jest.fn(async () => storedTeams),
    }

    const invitations = {
      findOne: jest.fn(
        async ({ where }) =>
          storedInvitations.find((item) =>
            Object.entries(where).every(([key, value]) => item[key] === value),
          ) || null,
      ),
      save: jest.fn(async (value) => {
        const saved = { id: value.id || storedInvitations.length + 201, ...value }

        storedInvitations = [...storedInvitations.filter((item) => item.id !== saved.id), saved]

        return saved
      }),
      create: jest.fn(() => ({})),
      find: jest.fn(async () => storedInvitations),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      })),
    }

    service = new AgencyTeamsService(
      users as any,
      teams as any,
      invitations as any,
      { log: jest.fn() } as any,
    )
  })

  it("creates a team, invites a recruiter, accepts the invitation and manages access", async () => {
    const team = await service.createTeam({ name: "North Team" } as any, actor)

    const invitation = await service.invite(
      {
        full_name: "New Recruiter",
        email: "new.recruiter@acceptance.test",
        role: UserRole.RECRUITER,
        team_id: team.id,
      } as any,
      actor,
    )

    const accepted = await service.accept(invitation.invite_token, "StrongPass123!")

    expect(accepted).toEqual(
      expect.objectContaining({
        email: "new.recruiter@acceptance.test",
        role: UserRole.RECRUITER,
      }),
    )
    expect(storedInvitations[0].status).toBe("accepted")

    const deactivated = await service.updateMember(accepted.id, { is_active: false } as any, actor)

    expect(deactivated.is_active).toBe(false)
    expect((deactivated as any).password_hash).toBeUndefined()
  })

  it("allows only one organization admin and one recruitment manager", async () => {
    await expect(
      service.invite(
        {
          full_name: "Second Admin",
          email: "admin.two@acceptance.test",
          role: UserRole.ORG_ADMIN,
        } as any,
        actor,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "STAFFING_ORG_ADMIN_LIMIT" }),
    })

    await service.invite(
      {
        full_name: "Recruitment Manager",
        email: "rm.one@acceptance.test",
        role: UserRole.RECRUITMENT_MANAGER,
      } as any,
      actor,
    )

    await expect(
      service.invite(
        {
          full_name: "Second Recruitment Manager",
          email: "rm.two@acceptance.test",
          role: UserRole.RECRUITMENT_MANAGER,
        } as any,
        actor,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "STAFFING_RECRUITMENT_MANAGER_LIMIT" }),
    })
  })

  it("creates a dedicated team when a team manager accepts an invitation", async () => {
    const invitation = await service.invite(
      {
        full_name: "New Team Manager",
        email: "team.manager@acceptance.test",
        role: UserRole.TEAM_MANAGER,
        team_id: 999,
      } as any,
      actor,
    )

    expect(invitation.team_id).toBeNull()

    const accepted = await service.accept(invitation.invite_token, "StrongPass123!")

    const manager = storedUsers.find((item) => item.id === accepted.id)

    const team = storedTeams.find((item) => item.manager_id === accepted.id)

    expect(team).toMatchObject({
      organization_id: organizationId,
      manager_id: accepted.id,
      is_active: true,
    })
    expect(manager.team_id).toBe(team.id)
  })

  it("does not assign a team manager to a second team", async () => {
    const manager = {
      id: 91,
      email: "single.team@acceptance.test",
      full_name: "Single Team Manager",
      role: UserRole.TEAM_MANAGER,
      organization_id: organizationId,
      is_active: true,
    }

    storedUsers.push(manager)

    await service.createTeam({ name: "First", manager_id: manager.id } as any, actor)

    await expect(
      service.createTeam({ name: "Second", manager_id: manager.id } as any, actor),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("does not expose a cross-tenant team or allow the last admin to be deactivated", async () => {
    storedTeams.push({ id: 999, organization_id: 999, name: "Other tenant" })
    await expect(
      service.updateTeam(999, { name: "Captured" } as any, actor),
    ).rejects.toBeInstanceOf(NotFoundException)
    await expect(
      service.updateMember(actor.id, { is_active: false } as any, actor),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("returns only the canonical team membership to a Team Manager", async () => {
    const lead = {
      id: 41,
      email: "lead@acceptance.test",
      full_name: "Team Lead",
      role: UserRole.TEAM_MANAGER,
      organization_id: organizationId,
      team_id: 101,
    }

    storedUsers.push(
      lead,
      {
        id: 31,
        email: "own@test",
        role: UserRole.RECRUITER,
        organization_id: organizationId,
        team_id: 101,
      },
      {
        id: 32,
        email: "other@test",
        role: UserRole.RECRUITER,
        organization_id: organizationId,
        team_id: 102,
      },
    )
    storedTeams.push(
      { id: 101, organization_id: organizationId, manager_id: 41, name: "Own", is_active: true },
      { id: 102, organization_id: organizationId, manager_id: 42, name: "Other", is_active: true },
    )

    const overview = await service.overview(lead as any)

    expect(overview.teams).toEqual([expect.objectContaining({ id: 101 })])
    expect(overview.members.map((member) => member.id)).toEqual(expect.arrayContaining([41, 31]))
    expect(overview.members.map((member) => member.id)).not.toContain(32)
    expect(overview.invitations).toEqual([])
  })
  it("removes membership and revokes access without erasing user history", async () => {
    storedUsers.push({
      id: 81,
      role: UserRole.RECRUITER,
      organization_id: organizationId,
      is_active: true,
      team_id: 101,
      refresh_token_hash: "token",
    })
    await service.removeMember(81, actor)
    expect(storedUsers.find((member) => member.id === 81)).toMatchObject({
      organization_id: null,
      is_active: false,
      team_id: null,
      refresh_token_hash: null,
    })
    await expect(service.removeMember(81, actor)).rejects.toThrow(NotFoundException)
  })

  it("rejects self deletion, foreign members and non-admin actors", async () => {
    await expect(service.removeMember(actor.id, actor)).rejects.toThrow("own account")
    storedUsers.push({ id: 82, role: UserRole.RECRUITER, organization_id: 99 })
    await expect(service.removeMember(82, actor)).rejects.toThrow(NotFoundException)
    await expect(service.removeMember(82, { ...actor, role: UserRole.RECRUITER })).rejects.toThrow(
      "cannot manage agency teams",
    )
  })

  it("requires reassignment before removing an active team's manager", async () => {
    storedUsers.push({
      id: 83,
      role: UserRole.TEAM_MANAGER,
      organization_id: organizationId,
      is_active: true,
    })
    storedTeams.push({ id: 101, organization_id: organizationId, manager_id: 83, is_active: true })
    await expect(service.removeMember(83, actor)).rejects.toThrow("Reassign")
    expect(storedUsers.find((member) => member.id === 83).is_active).toBe(true)
  })

  it("preserves the last active organization admin", async () => {
    storedUsers.push({
      id: 84,
      role: UserRole.ORG_ADMIN,
      organization_id: organizationId,
      is_active: true,
    })
    await expect(service.removeMember(84, { ...actor, role: UserRole.ADMIN })).rejects.toThrow(
      "at least one active admin",
    )
  })

  it("scopes a recruitment manager to their own members and teams", async () => {
    const manager = { ...actor, id: 51, role: UserRole.RECRUITMENT_MANAGER }

    storedUsers.push(
      manager,
      { id: 2, role: UserRole.ORG_ADMIN, organization_id: organizationId },
      { id: 52, role: UserRole.RECRUITMENT_MANAGER, organization_id: organizationId },
      {
        id: 41,
        role: UserRole.TEAM_MANAGER,
        organization_id: organizationId,
        recruitment_manager_id: 51,
        team_id: 101,
      },
      {
        id: 31,
        role: UserRole.RECRUITER,
        organization_id: organizationId,
        recruitment_manager_id: 51,
        team_id: 101,
      },
      {
        id: 42,
        role: UserRole.TEAM_MANAGER,
        organization_id: organizationId,
        recruitment_manager_id: 52,
        team_id: 102,
      },
    )
    storedTeams.push(
      {
        id: 101,
        organization_id: organizationId,
        recruitment_manager_id: 51,
        manager_id: 41,
        is_active: true,
      },
      {
        id: 102,
        organization_id: organizationId,
        recruitment_manager_id: 52,
        manager_id: 42,
        is_active: true,
      },
    )

    const overview = await service.overview(manager as any)

    expect(overview.members.map((member) => member.id).sort()).toEqual([31, 41, 51])
    expect(overview.teams.map((team) => team.id)).toEqual([101])
    await expect(service.removeMember(2, manager as any)).rejects.toBeInstanceOf(NotFoundException)
    await expect(service.removeMember(52, manager as any)).rejects.toBeInstanceOf(NotFoundException)
    await expect(service.removeMember(51, manager as any)).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })

  it("lets a recruitment manager manage owned teams and their team managers", async () => {
    const manager = { ...actor, id: 51, role: UserRole.RECRUITMENT_MANAGER }

    storedUsers.push(
      manager,
      {
        id: 41,
        role: UserRole.TEAM_MANAGER,
        organization_id: organizationId,
        recruitment_manager_id: 51,
      },
      {
        id: 42,
        role: UserRole.TEAM_MANAGER,
        organization_id: organizationId,
        recruitment_manager_id: 52,
      },
    )

    const team = await service.createTeam({ name: "Owned", manager_id: 41 } as any, manager as any)

    expect(team).toMatchObject({ recruitment_manager_id: 51, manager_id: 41 })
    await expect(
      service.createTeam({ name: "Foreign", manager_id: 42 } as any, manager as any),
    ).rejects.toBeInstanceOf(NotFoundException)
    await service.updateTeam(team.id, { name: "Updated" } as any, manager as any)
    await service.removeTeam(team.id, manager as any)
    expect(storedTeams.find((item) => item.id === team.id)).toMatchObject({ is_active: false })
  })

  it("lets a team manager manage only recruiters in their own team", async () => {
    const lead = { ...actor, id: 41, role: UserRole.TEAM_MANAGER, team_id: 101 }

    storedUsers.push(
      lead,
      { id: 31, role: UserRole.RECRUITER, organization_id: organizationId, team_id: 101 },
      { id: 32, role: UserRole.RECRUITER, organization_id: organizationId, team_id: 102 },
    )
    storedTeams.push({
      id: 101,
      organization_id: organizationId,
      manager_id: 41,
      is_active: true,
    })

    await service.updateMember(31, { is_active: false } as any, lead as any)
    expect(storedUsers.find((member) => member.id === 31).is_active).toBe(false)
    await expect(
      service.updateMember(32, { is_active: false } as any, lead as any),
    ).rejects.toBeInstanceOf(NotFoundException)
    await expect(
      service.updateMember(31, { role: UserRole.TEAM_MANAGER } as any, lead as any),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it("blocks recruiters from the teams service", async () => {
    await expect(
      service.overview({ ...actor, role: UserRole.RECRUITER } as any),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
