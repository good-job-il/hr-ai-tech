import { UserRole } from "../../common/enums/user-role.enum"
import { RecruitmentManagementService } from "./recruitment-management.service"

describe("RecruitmentManagementService RM-4 large-list acceptance", () => {
  it("aggregates 10,000 applications without truncating management totals", async () => {
    const now = new Date()
    const recruiters = Array.from({ length: 200 }, (_, index) => ({
      id: index + 1,
      email: `recruiter-${index + 1}@test`,
      full_name: `Recruiter ${index + 1}`,
      role: UserRole.RECRUITER,
      team_id: (index % 20) + 1,
      team_manager_id: (index % 20) + 1001,
      is_active: true,
    }))
    const applications = Array.from({ length: 10_000 }, (_, index) => ({
      id: index + 1,
      organization_id: 12,
      recruiter_id: (index % recruiters.length) + 1,
      team_manager_id: (index % 20) + 1001,
      employer_company_id: (index % 100) + 1,
      job_id: (index % 1_000) + 1,
      status: index % 10 === 0 ? "completed" : "new",
      candidate_name: `Candidate ${index + 1}`,
      job_title: `Job ${(index % 1_000) + 1}`,
      company: `Client ${(index % 100) + 1}`,
      created_date: now,
      updated_date: now,
    }))
    const jobs = Array.from({ length: 1_000 }, (_, index) => ({
      id: index + 1,
      title: `Job ${index + 1}`,
      recruiter_id: (index % recruiters.length) + 1,
      team_manager_id: (index % 20) + 1001,
      employer_company_id: (index % 100) + 1,
      is_closed: false,
    }))
    const teams = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      manager_id: index + 1001,
      name: `Team ${index + 1}`,
      is_active: true,
    }))
    const service = new RecruitmentManagementService(
      { find: jest.fn().mockResolvedValue(applications) } as any,
      {} as any,
      { find: jest.fn().mockResolvedValue(jobs) } as any,
      { find: jest.fn().mockResolvedValue(recruiters) } as any,
      { find: jest.fn().mockResolvedValue(teams) } as any,
      {} as any,
      {} as any,
    )

    const startedAt = performance.now()
    const result = await service.dashboard({
      id: 9,
      email: "manager@test",
      role: UserRole.RECRUITMENT_MANAGER,
      organization_id: 12,
      org_type: "staffing_agency",
    } as any)
    const elapsedMs = performance.now() - startedAt

    expect(result.summary.applications).toBe(10_000)
    expect(result.summary.placements).toBe(1_000)
    expect(Object.values(result.funnel).reduce((sum, value) => sum + value, 0)).toBe(10_000)
    expect(elapsedMs).toBeLessThan(2_000)
  })
})
