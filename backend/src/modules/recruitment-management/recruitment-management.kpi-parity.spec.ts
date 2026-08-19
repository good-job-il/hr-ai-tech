import { UserRole } from "../../common/enums/user-role.enum"
import { ReportsService } from "../reports/reports.service"
import { RecruitmentManagementService } from "./recruitment-management.service"

describe("RM-4 dashboard/report KPI parity", () => {
  it("returns identical application, placement and funnel totals for one filter set", async () => {
    const now = new Date()

    const applications = [
      {
        id: 1,
        organization_id: 12,
        employer_company_id: 9,
        job_id: 10,
        recruiter_id: 31,
        status: "new",
        source: "app",
        candidate_name: "A",
        job_title: "Engineer",
        company: "Client",
        created_date: now,
        updated_date: now,
        is_deleted: false,
      },
      {
        id: 2,
        organization_id: 12,
        employer_company_id: 9,
        job_id: 10,
        recruiter_id: 31,
        status: "completed",
        source: "app",
        candidate_name: "B",
        job_title: "Engineer",
        company: "Client",
        created_date: now,
        updated_date: now,
        is_deleted: false,
      },
      {
        id: 3,
        organization_id: 12,
        employer_company_id: 9,
        job_id: 10,
        recruiter_id: 31,
        status: "probation",
        source: "referral",
        candidate_name: "C",
        job_title: "Engineer",
        company: "Client",
        created_date: now,
        updated_date: now,
        is_deleted: false,
      },
    ]

    const applicationRepo = { find: jest.fn().mockResolvedValue(applications) }

    const emptyRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() }

    const users = {
      find: jest.fn().mockResolvedValue([
        {
          id: 31,
          role: UserRole.RECRUITER,
          email: "r@test",
          full_name: "Recruiter",
          is_active: true,
        },
      ]),
    }

    const reports = new ReportsService(
      applicationRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      users as any,
      emptyRepo as any,
      {
        getEffectivePermissions: jest
          .fn()
          .mockResolvedValue({ permissions: { view_compensation: false } }),
      } as any,
    )

    const dashboard = new RecruitmentManagementService(
      applicationRepo as any,
      {} as any,
      {
        find: jest.fn().mockResolvedValue([
          {
            id: 10,
            title: "Engineer",
            employer_company_id: 9,
            recruiter_id: 31,
            is_closed: false,
          },
        ]),
      } as any,
      users as any,
      emptyRepo as any,
      {} as any,
      {} as any,
    )

    const actor = {
      id: 9,
      email: "manager@test",
      role: UserRole.RECRUITMENT_MANAGER,
      organization_id: 12,
      org_type: "staffing_agency",
    } as any

    const query = {
      date_from: now.toISOString().slice(0, 10),
      date_to: now.toISOString().slice(0, 10),
      client_id: 9,
      job_id: 10,
      recruiter_id: 31,
    } as any

    const [reportResult, dashboardResult] = await Promise.all([
      reports.getManagementReport(query, actor),
      dashboard.dashboard(actor, false, query),
    ])

    const reportFunnel = Object.fromEntries(
      reportResult.funnel.map((row) => [row.status, row.count]),
    )

    expect(dashboardResult.summary.applications).toBe(reportResult.summary.applications)
    expect(dashboardResult.summary.placements).toBe(reportResult.summary.placements)
    expect(dashboardResult.funnel).toEqual(reportFunnel)
  })
})
