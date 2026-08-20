import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { CandidateSource } from "../candidates/entities/candidate.entity"
import { CandidatesService } from "../candidates/candidates.service"
import { ApplicationsService } from "../applications/applications.service"
import { InterviewsService } from "../interviews/interviews.service"
import { JobsService } from "../jobs/jobs.service"
import { UserRole } from "../../common/enums/user-role.enum"
import { OrgType } from "../../common/enums/org-type.enum"

const recruiter = (id: number) =>
  ({
    id,
    email: `recruiter-${id}@test.local`,
    full_name: `Recruiter ${id}`,
    role: UserRole.RECRUITER,
    organization_id: 12,
    org_type: OrgType.STAFFING_AGENCY,
    team_id: 4,
    team_manager_id: 41,
    recruitment_manager_id: 51,
  }) as any

const emptyRepo = () =>
  ({
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn(async (value) => value),
    findOne: jest.fn(async () => null),
    findAndCount: jest.fn(async () => [[], 0]),
  }) as any

const scopedRepo = (rows: Record<string, any>[]) =>
  ({
    findOne: jest.fn(async ({ where }: any) => {
      const filters = Array.isArray(where) ? where : [where]

      return (
        rows.find((row) =>
          filters.some((filter) =>
            Object.entries(filter).every(
              ([field, value]) => value === undefined || row[field] === value,
            ),
          ),
        ) ?? null
      )
    }),
  }) as any

describe("R-1 recruiter own boundary", () => {
  it("returns 404 for another recruiter record in the same tenant", async () => {
    const foreign = {
      id: 80,
      organization_id: 12,
      recruiter_id: 8,
      assigned_to: 8,
      is_deleted: false,
    }

    const candidates = new CandidatesService(
      scopedRepo([foreign]),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
    )

    const applications = new ApplicationsService(
      scopedRepo([foreign]),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      {} as any,
      {} as any,
      {} as any,
    )

    const jobs = new JobsService(
      scopedRepo([foreign]),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      {} as any,
    )

    const interviews = new InterviewsService(
      scopedRepo([foreign]),
      emptyRepo(),
      {} as any,
      applications,
      {} as any,
    )

    await expect(candidates.findById(80, recruiter(7))).rejects.toBeInstanceOf(NotFoundException)
    await expect(applications.findById(80, recruiter(7))).rejects.toBeInstanceOf(NotFoundException)
    await expect(jobs.findById(80, recruiter(7))).rejects.toBeInstanceOf(NotFoundException)
    await expect(interviews.findById(80, recruiter(7))).rejects.toBeInstanceOf(NotFoundException)
  })

  it("rejects assignment spoofing across candidates, applications, jobs and interviews", () => {
    const candidates = new CandidatesService(
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
    )

    const applications = new ApplicationsService(
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      {} as any,
      {} as any,
      {} as any,
    )

    const jobs = new JobsService(
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      {} as any,
    )

    const interviews = new InterviewsService(
      emptyRepo(),
      emptyRepo(),
      {} as any,
      {} as any,
      {} as any,
    )

    for (const service of [candidates, applications, jobs, interviews]) {
      expect(() =>
        (service as any).assertRecruiterOwnership({ recruiter_id: 8 }, recruiter(7)),
      ).toThrow(ForbiddenException)
    }

    expect(() =>
      (applications as any).assertRecruiterOwnership({ assigned_to: 8 }, recruiter(7)),
    ).toThrow(ForbiddenException)
  })

  it("allows only forward recruiter pipeline transitions and never recruiter reopen", async () => {
    const applications = new ApplicationsService(
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      {} as any,
      {} as any,
      {} as any,
    )

    expect(() =>
      (applications as any).assertStatusTransition("reviewed", "phone_interview", recruiter(7)),
    ).not.toThrow()
    expect(() =>
      (applications as any).assertStatusTransition("new", "hired", recruiter(7)),
    ).toThrow(ForbiddenException)
    await expect(applications.reopen(10, "reviewed", "retry", recruiter(7))).rejects.toBeInstanceOf(
      ForbiddenException,
    )
  })

  it("atomically exposes and assigns only an unassigned agency-pool candidate", async () => {
    const candidate: Record<string, any> = {
      id: 20,
      organization_id: 12,
      recruiter_id: null,
      source: CandidateSource.POOL,
      is_deleted: false,
      full_name: "Pool Candidate",
      email: "candidate@test.local",
    }

    const writes: any[] = []

    let pendingSet: Record<string, any> = {}

    const manager = {
      getRepository: jest.fn(() => ({
        createQueryBuilder: () => {
          const builder: any = {
            update: () => builder,
            set: (value: Record<string, any>) => {
              pendingSet = value

              return builder
            },
            where: () => builder,
            andWhere: () => builder,
            execute: async () => {
              if (candidate.recruiter_id != null) {
                return { affected: 0 }
              }

              Object.assign(candidate, pendingSet)

              return { affected: 1 }
            },
          }

          return builder
        },
        findOne: async () => (candidate.recruiter_id === 7 ? ({ ...candidate } as any) : null),
      })),
      create: jest.fn((_entity, value) => ({ ...value })),
      save: jest.fn(async (_entity, value) => {
        writes.push(value)

        return value
      }),
    }

    const dataSource = {
      transaction: jest.fn(async (work) => work(manager)),
    } as any

    const candidates = new CandidatesService(
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      dataSource,
    )

    await expect(candidates.claim(20, "Taking ownership", recruiter(7))).resolves.toEqual(
      expect.objectContaining({ recruiter_id: 7, team_id: 4 }),
    )
    await expect(candidates.claim(20, "Second claim", recruiter(8))).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event_type: "assigned" }),
        expect.objectContaining({
          action: "update",
          metadata: expect.objectContaining({ operation: "claim" }),
        }),
      ]),
    )
  })

  it("requires a scoped application when a recruiter creates an interview", async () => {
    const interviews = new InterviewsService(
      emptyRepo(),
      emptyRepo(),
      {} as any,
      {} as any,
      {} as any,
    )

    await expect(interviews.create({} as any, recruiter(7))).rejects.toBeInstanceOf(
      ForbiddenException,
    )
  })

  it("redacts CV fields without download_cv and preserves them during an allowed update", async () => {
    const stored: Record<string, any> = {
      id: 20,
      organization_id: 12,
      recruiter_id: 7,
      is_deleted: false,
      full_name: "Owned Candidate",
      resume_url: "https://api.test/uploads/cv.pdf",
      resume_filename: "cv.pdf",
    }

    const candidateRepo = {
      create: jest.fn((value) => ({ ...value })),
      findOne: jest.fn(async () => stored),
      save: jest.fn(async (value) => {
        Object.assign(stored, value)

        return stored
      }),
    } as any

    const permissions = {
      getEffectivePermissions: jest.fn(async () => ({
        permissions: { download_cv: false },
      })),
    } as any

    const candidates = new CandidatesService(
      candidateRepo,
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      emptyRepo(),
      undefined,
      permissions,
    )

    await expect(candidates.findById(20, recruiter(7))).resolves.toEqual(
      expect.objectContaining({ resume_url: null, resume_filename: null }),
    )
    await candidates.update(20, { full_name: "Updated Candidate" } as any, recruiter(7))
    expect(stored).toEqual(
      expect.objectContaining({
        full_name: "Updated Candidate",
        resume_url: "https://api.test/uploads/cv.pdf",
        resume_filename: "cv.pdf",
      }),
    )
  })
})
