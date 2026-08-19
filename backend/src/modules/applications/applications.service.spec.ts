import { BadRequestException, ConflictException } from "@nestjs/common"
import { UserRole } from "../../common/enums/user-role.enum"
import { ApplicationsService } from "./applications.service"

const repository = () => ({
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn(async (value) => value),
})

const actor = {
  id: 5,
  email: "owner@agency.test",
  full_name: "Owner",
  role: UserRole.ORG_ADMIN,
  organization_id: 11,
  org_type: "staffing_agency",
} as any

describe("ApplicationsService OA-2 lifecycle", () => {
  let apps: ReturnType<typeof repository>
  let jobs: ReturnType<typeof repository>
  let candidates: ReturnType<typeof repository>
  let service: ApplicationsService

  beforeEach(() => {
    apps = repository()
    jobs = repository()
    candidates = repository()
    service = new ApplicationsService(
      apps as any,
      repository() as any,
      jobs as any,
      candidates as any,
      repository() as any,
      { sendApplicationSubmitted: jest.fn() } as any,
      { create: jest.fn() } as any,
      { transaction: jest.fn() } as any,
    )
  })

  it("prevents reopening a completed application", async () => {
    apps.findOne.mockResolvedValue({ id: 1, organization_id: 11, status: "completed" })
    await expect(service.update(1, { status: "reviewed" } as any, actor)).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })

  it("blocks reopening through the generic status endpoint", async () => {
    apps.findOne.mockResolvedValue({ id: 2, organization_id: 11, status: "rejected" })
    await expect(
      service.changeStatus(2, "reviewed" as any, undefined, actor),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("reopens a rejected application through the explicit audited operation", async () => {
    apps.findOne.mockResolvedValue({ id: 2, organization_id: 11, status: "rejected" })
    const manager = {
      save: jest.fn(async (_entity, value) => value),
      create: jest.fn((_entity, value) => value),
    }
    const dataSource = (service as any).dataSource
    dataSource.transaction.mockImplementation(async (callback) => callback(manager))

    await expect(
      service.reopen(2, "reviewed" as any, "Candidate requested reconsideration", actor),
    ).resolves.toEqual(expect.objectContaining({ status: "reviewed" }))
    expect(manager.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        event_type: "status_changed",
        description: expect.stringContaining("Candidate requested reconsideration"),
      }),
    )
  })

  it("rejects a duplicate candidate and job pair before insert", async () => {
    jobs.findOne.mockResolvedValue({
      id: 9,
      organization_id: 11,
      employer_company_id: 3,
      title: "Engineer",
    })
    apps.findOne.mockResolvedValue({ id: 77, job_id: 9, candidate_id: 20 })

    await expect(
      service.create(
        {
          job_id: 9,
          candidate_id: 20,
          candidate_name: "Candidate",
          candidate_email: "candidate@example.test",
          status: "new",
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(apps.save).not.toHaveBeenCalled()
  })
})
