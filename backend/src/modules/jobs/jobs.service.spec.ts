import { JobsService } from "./jobs.service"
import { UserRole } from "../../common/enums/user-role.enum"
import { ForbiddenException } from "@nestjs/common"

describe("JobsService OA-2 state filters", () => {
  it("applies the route state as a server-side filter", async () => {
    const jobs = { findAndCount: jest.fn().mockResolvedValue([[], 0]) }

    const service = new JobsService(
      jobs as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    await service.findAll(
      {
        page: 1,
        limit: 20,
        sort: "created_date",
        order: "DESC",
        state: "on_hold",
        is_deleted: false,
      } as any,
      {
        id: 1,
        email: "admin@agency.test",
        role: UserRole.ORG_ADMIN,
        organization_id: 12,
      } as any,
    )

    expect(jobs.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization_id: 12, state: "on_hold" }),
      }),
    )
  })

  it("does not allow a public query to override the open state boundary", async () => {
    const jobs = { findAndCount: jest.fn().mockResolvedValue([[], 0]) }

    const service = new JobsService(
      jobs as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    await service.findAll({
      page: 1,
      limit: 20,
      sort: "created_date",
      order: "DESC",
      state: "closed",
      is_deleted: false,
    } as any)

    expect(jobs.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ state: "open", is_deleted: false }),
      }),
    )
  })

  it("rejects an assignee outside the agency tenant or expected role", async () => {
    const jobs = { create: jest.fn(), save: jest.fn() }

    const agencyClients = { findOne: jest.fn().mockResolvedValue({ id: 3 }) }

    const companies = { findOne: jest.fn().mockResolvedValue({ id: 9, name: "Client" }) }

    const users = { findOne: jest.fn().mockResolvedValue(null) }

    const service = new JobsService(
      jobs as any,
      {} as any,
      {} as any,
      agencyClients as any,
      companies as any,
      users as any,
      {} as any,
    )

    await expect(
      service.create(
        {
          title: "Recruiter",
          company: "Client",
          employer_company_id: 9,
          recruiter_id: 777,
        } as any,
        {
          id: 5,
          role: UserRole.RECRUITMENT_MANAGER,
          organization_id: 12,
          org_type: "staffing_agency",
        } as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(jobs.save).not.toHaveBeenCalled()
  })

  it("uses canonical team membership and rejects a recruiter from another team", async () => {
    const jobs = { create: jest.fn(), save: jest.fn() }

    const users = {
      findOne: jest.fn().mockResolvedValue({
        id: 31,
        role: UserRole.RECRUITER,
        organization_id: 12,
        team_id: 99,
        is_active: true,
      }),
    }

    const service = new JobsService(
      jobs as any,
      {} as any,
      {} as any,
      { findOne: jest.fn().mockResolvedValue({ id: 3 }) } as any,
      { findOne: jest.fn().mockResolvedValue({ id: 9, name: "Client" }) } as any,
      users as any,
      {} as any,
    )

    await expect(
      service.create(
        { title: "Engineer", employer_company_id: 9, recruiter_id: 31 } as any,
        {
          id: 41,
          email: "lead@test",
          role: UserRole.TEAM_MANAGER,
          organization_id: 12,
          org_type: "staffing_agency",
          team_id: 4,
        } as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(jobs.save).not.toHaveBeenCalled()
  })

  it("ignores query ownership and lists only the manager's canonical team", async () => {
    const jobs = { findAndCount: jest.fn().mockResolvedValue([[], 0]) }

    const service = new JobsService(
      jobs as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    await service.findAll(
      {
        page: 1,
        limit: 20,
        sort: "created_date",
        order: "DESC",
        organization_id: 999,
        recruiter_id: 777,
        is_deleted: false,
      } as any,
      {
        id: 41,
        email: "lead@test",
        role: UserRole.TEAM_MANAGER,
        organization_id: 12,
        team_id: 4,
      } as any,
    )

    expect(jobs.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization_id: 12, team_id: 4 }),
      }),
    )
  })
})
