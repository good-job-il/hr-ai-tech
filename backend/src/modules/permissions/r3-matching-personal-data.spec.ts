import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { ApplicationsService } from "../applications/applications.service"
import { CompensationService } from "../compensation/compensation.service"
import { AuditService } from "../audit/audit.service"
import { CandidatesController } from "../candidates/candidates.controller"
import { DomainOperationsController } from "../functions/domain-operations.controller"
import { UserRole } from "../../common/enums/user-role.enum"
import { OrgType } from "../../common/enums/org-type.enum"
import { ROLES_KEY } from "../../common/decorators/roles.decorator"

const recruiter = {
  id: 7,
  email: "recruiter@test.local",
  full_name: "Recruiter",
  role: UserRole.RECRUITER,
  organization_id: 12,
  org_type: OrgType.STAFFING_AGENCY,
  team_id: 4,
  team_manager_id: 41,
  recruitment_manager_id: 51,
} as any

const repo = () =>
  ({
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn(async (value) => value),
    findOne: jest.fn(),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    find: jest.fn().mockResolvedValue([]),
  }) as any

describe("R-3 matching, import policy and personal data", () => {
  it("returns the existing Application for repeated matching", async () => {
    const applications = repo()

    const candidates = repo()

    const jobs = repo()

    const users = repo()

    const existing = {
      id: 90,
      organization_id: 12,
      job_id: 20,
      candidate_id: 30,
      recruiter_id: 7,
      assigned_to: 7,
      is_deleted: false,
      status: "new",
    }

    candidates.findOne.mockResolvedValue({
      id: 30,
      organization_id: 12,
      recruiter_id: 7,
      full_name: "Candidate",
      email: "candidate@test.local",
      is_deleted: false,
    })
    users.findOne.mockImplementation(async ({ where }: any) => {
      if (where.email) {
        return null
      }

      return {
        id: where.id,
        organization_id: 12,
        role: where.role,
        team_id: 4,
        is_active: true,
      }
    })
    jobs.findOne.mockResolvedValue({
      id: 20,
      organization_id: 12,
      recruiter_id: 7,
      title: "Engineer",
    })
    applications.findOne.mockResolvedValue(existing)

    const dataSource = { transaction: jest.fn() }

    const service = new ApplicationsService(
      applications,
      repo(),
      jobs,
      candidates,
      users,
      {} as any,
      {} as any,
      dataSource as any,
    )

    await expect(
      service.assignCandidate({ job_id: 20, candidate_id: 30 }, recruiter),
    ).resolves.toEqual(existing)
    expect(dataSource.transaction).not.toHaveBeenCalled()
  })

  it("explicitly excludes Recruiter from every import write endpoint", () => {
    const createBatchRoles = Reflect.getMetadata(
      ROLES_KEY,
      CandidatesController.prototype.createBatch,
    ) as UserRole[]

    const runImportRoles = Reflect.getMetadata(
      ROLES_KEY,
      DomainOperationsController.prototype.queueCandidateImport,
    ) as UserRole[]

    const resumeImportRoles = Reflect.getMetadata(
      ROLES_KEY,
      DomainOperationsController.prototype.importResumes,
    ) as UserRole[]

    for (const roles of [createBatchRoles, runImportRoles, resumeImportRoles]) {
      expect(roles).not.toContain(UserRole.RECRUITER)
    }
  })

  it("returns only the Recruiter's own sanitized compensation", async () => {
    const plans = repo()

    plans.findAndCount.mockResolvedValue([
      [
        {
          id: 8,
          organization_id: 12,
          job_id: 20,
          client_name: "Client",
          recruiter_id: 7,
          total_fee: 10000,
          recruiter_compensation: 10,
          recruiter_compensation_type: "percent",
          team_manager_compensation: 5,
          recruitment_manager_compensation: 3,
          notes: "private plan terms",
        },
      ],
      1,
    ])

    const service = new CompensationService(plans, repo(), repo(), repo(), repo(), {
      log: jest.fn(),
    } as any)

    const result = await service.findAll(
      {
        page: 1,
        limit: 20,
        sort: "created_date",
        order: "DESC",
        recruiter_id: 999,
      } as any,
      recruiter,
    )

    expect(plans.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organization_id: 12, recruiter_id: 7 } }),
    )
    expect(result.data[0]).toEqual(
      expect.objectContaining({ recruiter_compensation: 10, own_compensation_amount: 1000 }),
    )
    expect(result.data[0]).not.toHaveProperty("total_fee")
    expect(result.data[0]).not.toHaveProperty("team_manager_compensation")
    expect(result.data[0]).not.toHaveProperty("notes")

    plans.findOne.mockResolvedValue({ id: 9, organization_id: 12, recruiter_id: 8 })
    await expect(service.findById(9, recruiter)).rejects.toBeInstanceOf(NotFoundException)
    await expect(
      service.update(8, { recruiter_compensation: 50 } as any, recruiter),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it("scopes personal activity to the authenticated actor", async () => {
    const logs = repo()

    const service = new AuditService(logs, repo())

    await service.findAll(
      { page: 1, limit: 20, sort: "created_date", order: "DESC", actor_user_id: 7 } as any,
      recruiter,
    )

    expect(logs.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization_id: 12, actor_user_id: "7" }),
      }),
    )

    logs.findAndCount.mockClear()

    const foreign = await service.findAll(
      { page: 1, limit: 20, sort: "created_date", order: "DESC", actor_user_id: 8 } as any,
      recruiter,
    )

    expect(foreign.data).toEqual([])
    expect(logs.findAndCount).not.toHaveBeenCalled()
  })
})
