import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { UserRole } from "../../common/enums/user-role.enum"
import { ReportsService } from "./reports.service"

const repo = () => ({ find: jest.fn().mockResolvedValue([]), findOne: jest.fn() })

describe("ReportsService OA-3", () => {
  it("builds metrics only from the current organization scope", async () => {
    const applications = repo()

    const created = new Date("2026-01-01T00:00:00Z")

    applications.find.mockResolvedValue([
      {
        id: 1,
        organization_id: 12,
        status: "completed",
        source: "pool_assignment",
        recruiter_id: 7,
        team_manager_id: 8,
        employer_company_id: 9,
        job_id: 10,
        company: "Client",
        job_title: "Engineer",
        created_date: created,
        updated_date: new Date("2026-01-11T00:00:00Z"),
      },
      {
        id: 2,
        organization_id: 12,
        status: "probation",
        source: "pool_assignment",
        recruiter_id: 7,
        team_manager_id: 8,
        employer_company_id: 9,
        job_id: 10,
        company: "Client",
        job_title: "Engineer",
        created_date: created,
        updated_date: new Date("2026-01-11T00:00:00Z"),
      },
    ])

    const timelines = repo()

    timelines.find.mockResolvedValue([
      {
        application_id: 1,
        event_type: "status_changed",
        new_value: "hired",
        created_date: new Date("2026-01-06T00:00:00Z"),
      },
    ])

    const users = repo()

    users.find.mockResolvedValue([
      { id: 7, role: UserRole.RECRUITER, full_name: "Recruiter", email: "r@test" },
    ])

    const permissions = {
      getEffectivePermissions: jest
        .fn()
        .mockResolvedValue({ permissions: { view_compensation: true } }),
    }

    const service = new ReportsService(
      applications as any,
      timelines as any,
      repo() as any,
      repo() as any,
      users as any,
      repo() as any,
      permissions as any,
    )

    const result = await service.getManagementReport(
      { date_from: "2026-01-01", date_to: "2026-01-31" } as any,
      { id: 3, role: UserRole.ORG_ADMIN, organization_id: 12 } as any,
    )

    expect(applications.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization_id: 12, is_deleted: false }),
      }),
    )
    expect(result.summary).toEqual(
      expect.objectContaining({ applications: 2, placements: 1, average_time_to_hire_days: 5 }),
    )
    expect(result.source_effectiveness[0]).toEqual(
      expect.objectContaining({ source: "pool_assignment", conversion_rate: 50 }),
    )
    expect(result.recruiter_workload[0]).toEqual(
      expect.objectContaining({
        recruiter_id: 7,
        recruiter_name: "Recruiter",
        active_applications: 1,
        open_jobs: 0,
      }),
    )
  })

  it("keeps Team Manager reports inside membership team_id", async () => {
    const applications = repo()

    const users = repo()

    const jobs = repo()

    const teams = repo()

    applications.find.mockResolvedValue([
      {
        id: 1,
        organization_id: 12,
        team_id: 4,
        status: "new",
        source: "inbound",
        recruiter_id: 7,
        team_manager_id: 41,
        employer_company_id: 9,
        job_id: 10,
        company: "Client",
        job_title: "Engineer",
        created_date: new Date("2026-01-01T00:00:00Z"),
        updated_date: new Date("2026-01-02T00:00:00Z"),
      },
    ])
    users.find.mockResolvedValue([
      { id: 7, role: UserRole.RECRUITER, team_id: 4, full_name: "Recruiter", email: "r@test" },
    ])
    jobs.find.mockResolvedValue([{ id: 10, recruiter_id: 7, is_closed: false }])
    teams.find.mockResolvedValue([{ id: 4, name: "Alpha", manager_id: 41 }])

    const service = new ReportsService(
      applications as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      repo() as any,
      teams as any,
      users as any,
      jobs as any,
      {
        getEffectivePermissions: jest
          .fn()
          .mockResolvedValue({ permissions: { view_compensation: false } }),
      } as any,
    )

    const result = await service.getManagementReport(
      { date_from: "2026-01-01", date_to: "2026-01-31" } as any,
      { id: 41, role: UserRole.TEAM_MANAGER, organization_id: 12, team_id: 4 } as any,
    )

    expect(applications.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization_id: 12, team_id: 4 }),
      }),
    )
    expect(users.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization_id: 12, team_id: 4 }),
      }),
    )
    expect(result.team_performance).toEqual([])
    expect(result.dimensions.teams).toEqual([])
    expect(result.recruiter_workload).toEqual([
      expect.objectContaining({
        recruiter_id: 7,
        active_applications: 1,
        open_jobs: 1,
        overloaded: false,
      }),
    ])
  })

  it("rejects a Team Manager query that asks for another team", async () => {
    const service = new ReportsService(
      repo() as any,
      repo() as any,
      repo() as any,
      repo() as any,
      repo() as any,
      repo() as any,
      { getEffectivePermissions: jest.fn() } as any,
    )

    await expect(
      service.getManagementReport(
        { team_id: 99 } as any,
        { id: 41, role: UserRole.TEAM_MANAGER, organization_id: 12, team_id: 4 } as any,
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("rejects a Team Manager without team membership", async () => {
    const service = new ReportsService(
      repo() as any,
      repo() as any,
      repo() as any,
      repo() as any,
      repo() as any,
      repo() as any,
      { getEffectivePermissions: jest.fn() } as any,
    )

    await expect(
      service.getManagementReport(
        {} as any,
        { id: 41, role: UserRole.TEAM_MANAGER, organization_id: 12, team_id: null } as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
