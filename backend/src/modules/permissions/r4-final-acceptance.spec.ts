import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { UserRole } from "../../common/enums/user-role.enum"
import { ApplicationsService } from "../applications/applications.service"
import { ApplicationEntity } from "../applications/entities/application.entity"
import { ApplicationTimelineEntity } from "../applications/entities/application-timeline.entity"
import { CandidatesService } from "../candidates/candidates.service"
import { InterviewsService } from "../interviews/interviews.service"
import { InterviewEntity } from "../interviews/interview.entity"
import { JobsService } from "../jobs/jobs.service"
import { AuditLogEntity } from "../audit/audit-log.entity"

function operatorOf(value: any): { type: string; inner: any } | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const type = value._type || value.type

  if (typeof type !== "string") {
    return null
  }

  return {
    type,
    inner: Object.prototype.hasOwnProperty.call(value, "_value") ? value._value : value.value,
  }
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
    return operator.inner.includes(rowValue)
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
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn(async (value) => {
      const saved = {
        id: value.id ?? rows.length + 1,
        created_date: value.created_date ?? new Date(),
        updated_date: new Date(),
        is_deleted: value.is_deleted ?? false,
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
    remove: jest.fn(async (value) => {
      const index = rows.findIndex((row) => row.id === value.id)

      if (index >= 0) {
        rows.splice(index, 1)
      }
    }),
  }
}

const recruiter = (id: number, organizationId = 12, teamId = 4) =>
  ({
    id,
    email: `recruiter-${id}@test.local`,
    full_name: `Recruiter ${id}`,
    role: UserRole.RECRUITER,
    organization_id: organizationId,
    org_type: "staffing_agency",
    team_id: teamId,
    team_manager_id: teamId === 4 ? 41 : 42,
    recruitment_manager_id: organizationId === 12 ? 51 : 52,
  }) as any

const pageQuery = { page: 1, limit: 50, sort: "created_date", order: "DESC" } as any

describe("R-4 final Recruiter acceptance", () => {
  const jobs = [
    {
      id: 10,
      organization_id: 12,
      team_id: 4,
      recruiter_id: 7,
      is_deleted: false,
      title: "Engineer",
      company: "Client",
      state: "open",
    },
    {
      id: 11,
      organization_id: 12,
      team_id: 4,
      recruiter_id: 8,
      is_deleted: false,
      title: "Foreign",
      state: "open",
    },
    {
      id: 12,
      organization_id: 12,
      team_id: 5,
      recruiter_id: 9,
      is_deleted: false,
      title: "Other team",
      state: "open",
    },
    {
      id: 13,
      organization_id: 99,
      team_id: 9,
      recruiter_id: 10,
      is_deleted: false,
      title: "Other tenant",
      state: "open",
    },
  ]

  const candidates = [
    {
      id: 20,
      organization_id: 12,
      team_id: 4,
      recruiter_id: 7,
      is_deleted: false,
      full_name: "Ada",
      email: "ada@test.local",
      status: "new",
    },
    {
      id: 21,
      organization_id: 12,
      team_id: 4,
      recruiter_id: 8,
      is_deleted: false,
      full_name: "Foreign",
      status: "new",
    },
    {
      id: 22,
      organization_id: 12,
      team_id: 5,
      recruiter_id: 9,
      is_deleted: false,
      full_name: "Other team",
      status: "new",
    },
    {
      id: 23,
      organization_id: 99,
      team_id: 9,
      recruiter_id: 10,
      is_deleted: false,
      full_name: "Other tenant",
      status: "new",
    },
  ]

  it("completes job → candidate → Application → interview → status transition", async () => {
    const applications: any[] = []

    const interviews: any[] = []

    const timelines: any[] = []

    const auditLogs: any[] = []

    const jobRepo = memoryRepo(jobs)

    const candidateRepo = memoryRepo(candidates)

    const appRepo = memoryRepo(applications)

    const interviewRepo = memoryRepo(interviews)

    const timelineRepo = memoryRepo(timelines)

    const auditRepo = memoryRepo(auditLogs)

    const users = memoryRepo([
      { ...recruiter(7), is_active: true },
      { id: 41, role: UserRole.TEAM_MANAGER, organization_id: 12, team_id: 4, is_active: true },
      {
        id: 51,
        role: UserRole.RECRUITMENT_MANAGER,
        organization_id: 12,
        team_id: 4,
        is_active: true,
      },
    ])

    const repositoryFor = (entity: any) => {
      if (entity === ApplicationEntity) {
        return appRepo
      }

      if (entity === InterviewEntity) {
        return interviewRepo
      }

      if (entity === ApplicationTimelineEntity) {
        return timelineRepo
      }

      if (entity === AuditLogEntity) {
        return auditRepo
      }

      throw new Error(`Unexpected repository ${entity?.name}`)
    }

    const dataSource = {
      transaction: jest.fn(async (work) =>
        work({
          getRepository: jest.fn((entity) => repositoryFor(entity)),
          create: jest.fn((_entity, value) => ({ ...value })),
          save: jest.fn(async (entity, value) => repositoryFor(entity).save(value)),
        }),
      ),
    } as any

    const applicationService = new ApplicationsService(
      appRepo as any,
      timelineRepo as any,
      jobRepo as any,
      candidateRepo as any,
      users as any,
      { sendApplicationSubmitted: jest.fn().mockResolvedValue(undefined) } as any,
      { create: jest.fn().mockResolvedValue(undefined) } as any,
      dataSource,
    )

    const interviewService = new InterviewsService(
      interviewRepo as any,
      users as any,
      { sendInterviewScheduled: jest.fn().mockResolvedValue(undefined) } as any,
      applicationService,
      dataSource,
    )

    const jobsService = new JobsService(
      jobRepo as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      users as any,
      { log: jest.fn() } as any,
    )

    const dashboardJobs = await jobsService.findAll(pageQuery, recruiter(7))

    expect(dashboardJobs.data.map((row) => row.id)).toEqual([10])

    const application = await applicationService.assignCandidate(
      { job_id: 10, candidate_id: 20 },
      recruiter(7),
    )

    expect(application).toEqual(
      expect.objectContaining({
        job_id: 10,
        candidate_id: 20,
        recruiter_id: 7,
        assigned_to: 7,
        organization_id: 12,
        status: "new",
      }),
    )

    const interview = await interviewService.create(
      {
        application_id: application.id,
        date: "2026-08-21",
        time: "10:00",
        type: "video",
        status: "scheduled",
      } as any,
      recruiter(7),
    )

    expect(interview).toEqual(
      expect.objectContaining({
        application_id: application.id,
        candidate_id: 20,
        job_id: 10,
        recruiter_id: 7,
      }),
    )

    const updated = await applicationService.changeStatus(
      application.id,
      "reviewed",
      undefined,
      recruiter(7),
    )

    expect(updated.status).toBe("reviewed")
    expect(timelines.map((event) => event.event_type)).toEqual(
      expect.arrayContaining(["submitted", "interview_scheduled", "status_changed"]),
    )
  })

  it("blocks another Recruiter, another team and another tenant", async () => {
    const candidateService = new CandidatesService(
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

    const jobsService = new JobsService(
      memoryRepo(jobs) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      { log: jest.fn() } as any,
    )

    for (const id of [21, 22, 23]) {
      await expect(candidateService.findById(id, recruiter(7))).rejects.toBeInstanceOf(
        NotFoundException,
      )
    }

    for (const id of [11, 12, 13]) {
      await expect(jobsService.findById(id, recruiter(7))).rejects.toBeInstanceOf(NotFoundException)
    }

    await expect(
      candidateService.update(20, { recruiter_id: 8 } as any, recruiter(7)),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it("keeps all, active and pipeline filters inside own scope", async () => {
    const applications = [
      {
        id: 30,
        organization_id: 12,
        recruiter_id: 7,
        candidate_id: 20,
        status: "reviewed",
        is_deleted: false,
      },
      {
        id: 31,
        organization_id: 12,
        recruiter_id: 8,
        candidate_id: 21,
        status: "reviewed",
        is_deleted: false,
      },
    ]

    const candidateService = new CandidatesService(
      memoryRepo(candidates) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo([]) as any,
      memoryRepo(applications) as any,
    )

    const all = await candidateService.findAll(pageQuery, recruiter(7))

    const active = await candidateService.findAll({ ...pageQuery, active: true }, recruiter(7))

    const pipeline = await candidateService.findAll(
      { ...pageQuery, in_pipeline: true },
      recruiter(7),
    )

    expect(all.data.map((row) => row.id)).toEqual([20])
    expect(active.data.map((row) => row.id)).toEqual([20])
    expect(pipeline.data.map((row) => row.id)).toEqual([20])
  })
})
