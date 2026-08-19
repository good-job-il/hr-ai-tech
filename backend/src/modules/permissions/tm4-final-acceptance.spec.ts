import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common"
import { UserRole } from "../../common/enums/user-role.enum"
import { ApplicationsService } from "../applications/applications.service"
import { ApplicationEntity } from "../applications/entities/application.entity"
import { AuditService } from "../audit/audit.service"
import { CandidatesService } from "../candidates/candidates.service"
import { CommunicationService } from "../communication/communication.service"
import { CompensationService } from "../compensation/compensation.service"
import { ImportService } from "../functions/services/import.service"
import { InterviewsService } from "../interviews/interviews.service"
import { JobsService } from "../jobs/jobs.service"
import { PermissionsService } from "../permissions/permissions.service"
import { RecruitmentManagementService } from "../recruitment-management/recruitment-management.service"
import { ReportsService } from "../reports/reports.service"

function operatorOf(value: any): { type: string; inner: any } | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const type = value._type || value.type

  if (typeof type !== "string") {
    return null
  }

  const inner = Object.prototype.hasOwnProperty.call(value, "_value") ? value._value : value.value

  return { type, inner }
}

function matchesValue(rowValue: any, expected: any): boolean {
  if (expected === undefined) {
    return true
  }

  const operator = operatorOf(expected)

  if (!operator) {
    return rowValue === expected
  }

  if (operator.type === "in") {
    return operator.inner.includes(rowValue) || operator.inner.includes(String(rowValue))
  }

  if (operator.type === "not") {
    return !matchesValue(rowValue, operator.inner)
  }

  return true
}

function matchesWhere(row: Record<string, any>, where: any): boolean {
  if (!where) {
    return true
  }

  if (Array.isArray(where)) {
    return where.some((clause) => matchesWhere(row, clause))
  }

  return Object.entries(where).every(([key, value]) => matchesValue(row[key], value))
}

function memoryRepo(rows: any[]) {
  return {
    find: jest.fn(async (options: any = {}) =>
      rows.filter((row) => matchesWhere(row, options.where)),
    ),
    findOne: jest.fn(
      async (options: any = {}) => rows.find((row) => matchesWhere(row, options.where)) ?? null,
    ),
    findAndCount: jest.fn(async (options: any = {}) => {
      const data = rows.filter((row) => matchesWhere(row, options.where))

      return [data, data.length]
    }),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => {
      const saved = {
        is_deleted: false,
        created_date: new Date(),
        updated_date: new Date(),
        id: value.id ?? rows.length + 1,
        ...value,
      }

      const index = rows.findIndex((row) => row.id === saved.id)

      if (index >= 0) {
        rows[index] = { ...rows[index], ...saved }
      } else {
        rows.push(saved)
      }

      return saved
    }),
  }
}

const pageQuery = { page: 1, limit: 50, sort: "created_date" as const, order: "DESC" as const }

const alpha = {
  id: 41,
  email: "alpha@agency.test",
  full_name: "Alpha Lead",
  role: UserRole.TEAM_MANAGER,
  organization_id: 12,
  org_type: "staffing_agency",
  team_id: 4,
} as any

const beta = {
  ...alpha,
  id: 42,
  email: "beta@agency.test",
  full_name: "Beta Lead",
  team_id: 5,
}

describe("TM-4 two-team tenant isolation", () => {
  const jobs = [
    { id: 10, organization_id: 12, team_id: 4, is_deleted: false, title: "Alpha Engineer" },
    { id: 11, organization_id: 12, team_id: 5, is_deleted: false, title: "Beta Engineer" },
  ]

  const candidates = [
    {
      id: 20,
      organization_id: 12,
      team_id: 4,
      is_deleted: false,
      full_name: "Ada",
      email: "ada@test",
    },
    {
      id: 21,
      organization_id: 12,
      team_id: 5,
      is_deleted: false,
      full_name: "Ben",
      email: "ben@test",
    },
  ]

  const applications = [
    {
      id: 30,
      organization_id: 12,
      team_id: 4,
      is_deleted: false,
      status: "new",
      candidate_id: 20,
      job_id: 10,
      created_date: new Date(),
      updated_date: new Date(),
    },
    {
      id: 31,
      organization_id: 12,
      team_id: 5,
      is_deleted: false,
      status: "hired",
      candidate_id: 21,
      job_id: 11,
      created_date: new Date(),
      updated_date: new Date(),
    },
  ]

  const interviews = [
    { id: 40, organization_id: 12, team_id: 4, application_id: 30 },
    { id: 41, organization_id: 12, team_id: 5, application_id: 31 },
  ]

  const batches = [
    { id: 50, organization_id: 12, team_id: 4, status: "pending" },
    { id: 51, organization_id: 12, team_id: 5, status: "pending" },
  ]

  const plans = [
    { id: 60, organization_id: 12, team_id: 4, total_fee: 10 },
    { id: 61, organization_id: 12, team_id: 5, total_fee: 99 },
  ]

  it("lists jobs, candidates, applications and interviews only for the manager team", async () => {
    const jobsService = new JobsService(
      memoryRepo(jobs) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      { log: jest.fn() } as any,
    )

    const candidatesService = new CandidatesService(
      memoryRepo(candidates) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
    )

    const applicationsService = new ApplicationsService(
      memoryRepo(applications) as any,
      memoryRepo([]) as any,
      memoryRepo(jobs) as any,
      memoryRepo(candidates) as any,
      memoryRepo([]) as any,
      { sendApplicationSubmitted: jest.fn() } as any,
      { create: jest.fn().mockResolvedValue(undefined) } as any,
      { transaction: jest.fn() } as any,
    )

    const interviewsService = new InterviewsService(
      memoryRepo(interviews) as any,
      memoryRepo([]) as any,
      {} as any,
      applicationsService,
      { transaction: jest.fn() } as any,
    )

    const [
      alphaJobs,
      betaJobs,
      alphaCandidates,
      betaCandidates,
      alphaApps,
      betaApps,
      alphaIv,
      betaIv,
    ] = await Promise.all([
      jobsService.findAll(pageQuery as any, alpha),
      jobsService.findAll(pageQuery as any, beta),
      candidatesService.findAll(pageQuery as any, alpha),
      candidatesService.findAll(pageQuery as any, beta),
      applicationsService.findAll(pageQuery as any, alpha),
      applicationsService.findAll(pageQuery as any, beta),
      interviewsService.findAll(pageQuery as any, alpha),
      interviewsService.findAll(pageQuery as any, beta),
    ])

    expect(alphaJobs.data.map((row) => row.id)).toEqual([10])
    expect(betaJobs.data.map((row) => row.id)).toEqual([11])
    expect(alphaCandidates.data.map((row) => row.id)).toEqual([20])
    expect(betaCandidates.data.map((row) => row.id)).toEqual([21])
    expect(alphaApps.data.map((row) => row.id)).toEqual([30])
    expect(betaApps.data.map((row) => row.id)).toEqual([31])
    expect(alphaIv.data.map((row) => row.id)).toEqual([40])
    expect(betaIv.data.map((row) => row.id)).toEqual([41])
  })

  it("returns 404 for the other team's detail, nested note, interview and communication", async () => {
    const candidatesService = new CandidatesService(
      memoryRepo(candidates) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
    )

    const applicationsService = new ApplicationsService(
      memoryRepo(applications) as any,
      memoryRepo([]) as any,
      memoryRepo(jobs) as any,
      memoryRepo(candidates) as any,
      memoryRepo([]) as any,
      { sendApplicationSubmitted: jest.fn() } as any,
      { create: jest.fn().mockResolvedValue(undefined) } as any,
      { transaction: jest.fn() } as any,
    )

    const interviewsService = new InterviewsService(
      memoryRepo(interviews) as any,
      memoryRepo([]) as any,
      {} as any,
      applicationsService,
      { transaction: jest.fn() } as any,
    )

    const communication = new CommunicationService(
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      candidatesService,
      {} as any,
      {} as any,
    )

    await expect(candidatesService.findById(21, alpha)).rejects.toBeInstanceOf(NotFoundException)
    await expect(
      candidatesService.createNote(21, { content: "leak" } as any, alpha),
    ).rejects.toBeInstanceOf(NotFoundException)
    await expect(applicationsService.findById(31, alpha)).rejects.toBeInstanceOf(NotFoundException)
    await expect(interviewsService.findById(41, alpha)).rejects.toBeInstanceOf(NotFoundException)
    await expect(
      interviewsService.create({ application_id: 31, scheduled_at: new Date() } as any, alpha),
    ).rejects.toBeInstanceOf(NotFoundException)
    await expect(
      communication.findAll({ ...pageQuery, candidate_id: 21 } as any, alpha),
    ).rejects.toBeInstanceOf(NotFoundException)
    await expect(communication.findAll(pageQuery as any, alpha)).resolves.toEqual(
      expect.objectContaining({ data: [] }),
    )
  })

  it("hides the other team's import batch, compensation, reports and activity", async () => {
    const importService = new ImportService(
      memoryRepo([]) as any,
      memoryRepo(batches) as any,
      memoryRepo([]) as any,
      {} as any,
      {} as any,
    )

    const candidatesService = new CandidatesService(
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo(batches) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
    )

    const compensation = new CompensationService(
      memoryRepo(plans) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      { log: jest.fn() } as any,
    )

    const reports = new ReportsService(
      memoryRepo(
        applications.map((row) => ({
          ...row,
          source: "import",
          recruiter_id: 7,
          created_date: new Date(),
          updated_date: new Date(),
        })),
      ) as any,
      memoryRepo([]) as any,
      memoryRepo(plans) as any,
      memoryRepo([
        { id: 4, name: "Alpha", manager_id: 41, organization_id: 12, is_active: true },
        { id: 5, name: "Beta", manager_id: 42, organization_id: 12, is_active: true },
      ]) as any,
      memoryRepo([
        { id: 7, role: UserRole.RECRUITER, team_id: 4, full_name: "Rec A", email: "a@test" },
        { id: 8, role: UserRole.RECRUITER, team_id: 5, full_name: "Rec B", email: "b@test" },
      ]) as any,
      memoryRepo([]) as any,
      {
        getEffectivePermissions: jest
          .fn()
          .mockResolvedValue({ permissions: { view_compensation: true } }),
      } as any,
    )

    const audit = new AuditService(
      memoryRepo([
        {
          id: 70,
          organization_id: 12,
          actor_user_id: "41",
          entity_type: "Candidate",
          action: "create",
        },
        {
          id: 71,
          organization_id: 12,
          actor_user_id: "42",
          entity_type: "Candidate",
          action: "create",
        },
        {
          id: 72,
          organization_id: 12,
          actor_user_id: "41",
          entity_type: "PermissionMatrix",
          action: "export",
        },
      ]) as any,
      memoryRepo([alpha, { id: 7, team_id: 4, organization_id: 12 }]) as any,
    )

    const dashboard = new RecruitmentManagementService(
      memoryRepo(applications) as any,
      {} as any,
      memoryRepo(jobs) as any,
      memoryRepo([{ id: 7, role: UserRole.RECRUITER, team_id: 4, is_active: true }]) as any,
      memoryRepo([{ id: 4, name: "Alpha", manager_id: 41, is_active: true }]) as any,
      { createUnreadOnce: jest.fn() } as any,
      {} as any,
    )

    await expect(
      importService.validateImportBatch({ import_batch_id: 51 } as any, alpha),
    ).rejects.toBeInstanceOf(NotFoundException)
    await expect(candidatesService.getBatch(51, alpha)).rejects.toBeInstanceOf(NotFoundException)
    expect((await candidatesService.getBatches(alpha)).map((row) => row.id)).toEqual([50])

    const compensationPage = await compensation.findAll(pageQuery as any, alpha)

    expect(compensationPage.data.map((row) => row.id)).toEqual([60])

    const report = await reports.getManagementReport(
      { date_from: "2020-01-01", date_to: "2030-01-01" } as any,
      alpha,
    )

    expect(report.summary.applications).toBe(1)
    expect(report.summary.placements).toBe(0)
    expect(report.team_performance).toEqual([])
    expect(report.summary.placement_revenue).toBe(0)

    const activity = await audit.findAll(pageQuery as any, alpha)

    expect(activity.data.map((row) => row.id)).toEqual([70])

    const home = await dashboard.dashboard(alpha, false, {
      date_from: "2020-01-01",
      date_to: "2030-01-01",
    } as any)

    expect(home.summary.applications).toBe(1)
    expect(home.summary.placements).toBe(0)
    await expect(dashboard.dashboard(alpha, false, { team_id: 5 } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })
})

describe("TM-4 import → assign → pipeline → hire", () => {
  it("keeps ownership, duplicate prevention and hire metrics inside one team", async () => {
    const now = new Date()

    const users = [
      { ...alpha, is_active: true },
      {
        id: 7,
        role: UserRole.RECRUITER,
        organization_id: 12,
        team_id: 4,
        is_active: true,
        email: "rec@test",
        full_name: "Recruiter",
      },
      {
        id: 8,
        role: UserRole.RECRUITER,
        organization_id: 12,
        team_id: 5,
        is_active: true,
        email: "other@test",
        full_name: "Other",
      },
    ]

    const batches: any[] = []

    const imported: any[] = []

    const jobs = [
      {
        id: 10,
        organization_id: 12,
        team_id: 4,
        is_deleted: false,
        title: "Engineer",
        company: "Client",
        employer_company_id: 9,
      },
    ]

    const applications: any[] = []

    const userRepo = memoryRepo(users)

    const batchRepo = memoryRepo(batches)

    const candidateRepo = memoryRepo(imported)

    const jobRepo = memoryRepo(jobs)

    const appRepo = memoryRepo(applications)

    const candidatesService = new CandidatesService(
      candidateRepo as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      batchRepo as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      userRepo as any,
      memoryRepo([]) as any,
    )

    const importService = new ImportService(
      candidateRepo as any,
      batchRepo as any,
      memoryRepo([]) as any,
      {} as any,
      candidatesService,
    )

    const dataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: () => ({
            save: async (value: any) =>
              appRepo.save({ is_deleted: false, created_date: now, ...value }),
          }),
          save: jest.fn(async (entity: any, value: any) => {
            if (entity === ApplicationEntity) {
              return appRepo.save({ is_deleted: false, created_date: now, ...value })
            }

            return value
          }),
          create: jest.fn((_entity, value) => value),
        }),
      ),
    }

    const applicationsService = new ApplicationsService(
      appRepo as any,
      memoryRepo([]) as any,
      jobRepo as any,
      candidateRepo as any,
      userRepo as any,
      { sendApplicationSubmitted: jest.fn().mockResolvedValue(undefined) } as any,
      { create: jest.fn().mockResolvedValue(undefined) } as any,
      dataSource as any,
    )

    const reports = new ReportsService(
      appRepo as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([{ id: 4, name: "Alpha", manager_id: 41, is_active: true }]) as any,
      userRepo as any,
      memoryRepo([]) as any,
      {
        getEffectivePermissions: jest
          .fn()
          .mockResolvedValue({ permissions: { view_compensation: false } }),
      } as any,
    )

    const batch = await candidatesService.createBatch({ recruiter_id: 7 } as any, alpha)

    expect(batch.team_id).toBe(4)
    await expect(
      candidatesService.createBatch({ recruiter_id: 8 } as any, alpha),
    ).rejects.toBeInstanceOf(ForbiddenException)

    const created = await importService.createBulkCandidates(
      {
        import_batch_id: batch.id,
        candidates_data: [{ full_name: "Ada", email: "ada@test", recruiter_id: 7 }],
      } as any,
      alpha,
    )

    expect(created.created[0].team_id).toBe(4)
    expect(created.failed).toEqual([])

    const retried = await candidatesService.updateBatch(
      batch.id,
      { team_id: 5, status: "pending" } as any,
      alpha,
    )

    expect(retried.team_id).toBe(4)
    expect(retried.status).toBe("pending")

    const application = await applicationsService.create(
      {
        job_id: 10,
        candidate_id: created.created[0].id,
        candidate_name: "Ada",
        candidate_email: "ada@test",
        recruiter_id: 7,
        status: "new",
        source: "import",
      } as any,
      alpha,
    )

    expect(application.team_id).toBe(4)
    await expect(
      applicationsService.create(
        {
          job_id: 10,
          candidate_id: created.created[0].id,
          candidate_name: "Ada",
          candidate_email: "ada@test",
          recruiter_id: 7,
          status: "new",
        } as any,
        alpha,
      ),
    ).rejects.toBeInstanceOf(ConflictException)

    const hired = await applicationsService.update(
      application.id,
      { status: "hired" } as any,
      alpha,
    )

    expect(hired.status).toBe("hired")

    const report = await reports.getManagementReport(
      { date_from: now.toISOString().slice(0, 10), date_to: now.toISOString().slice(0, 10) } as any,
      alpha,
    )

    expect(report.summary.applications).toBe(1)
    expect(report.summary.placements).toBe(1)
    expect(report.summary.placement_revenue).toBeNull()
    expect(report.dimensions.teams).toEqual([])

    const otherReport = await reports.getManagementReport(
      { date_from: now.toISOString().slice(0, 10), date_to: now.toISOString().slice(0, 10) } as any,
      beta,
    )

    expect(otherReport.summary.applications).toBe(0)
    expect(otherReport.summary.placements).toBe(0)
  })
})

describe("TM-4 aggregate and export ceilings", () => {
  it("rejects Permission Matrix export and does not leak compensation without permission", async () => {
    const permissions = new PermissionsService(
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      { log: jest.fn() } as any,
    )

    await expect(
      permissions.exportMatrices({ page: 1, limit: 50 } as any, alpha),
    ).rejects.toBeInstanceOf(ForbiddenException)

    const effective = await permissions.getEffectivePermissions(alpha)

    expect(effective.permissions.manage_users).toBe(false)
    expect(effective.permissions.manage_settings).toBe(false)
  })
})
