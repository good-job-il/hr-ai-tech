import { NotFoundException } from "@nestjs/common"
import { CompensationService } from "./compensation.service"
import { UserRole } from "../../common/enums/user-role.enum"
import { OrgType } from "../../common/enums/org-type.enum"

const repo = () => ({
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  findOne: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn(async (value) => value),
  remove: jest.fn(),
})

describe("CompensationService OA-2 canonical relations", () => {
  it("resolves a job only inside the current organization", async () => {
    const plans = repo()

    const jobs = repo()

    const service = new CompensationService(
      plans as any,
      jobs as any,
      repo() as any,
      repo() as any,
      repo() as any,
      { log: jest.fn() } as any,
    )

    const actor = {
      id: 4,
      email: "owner@agency.test",
      role: UserRole.ORG_ADMIN,
      org_type: OrgType.STAFFING_AGENCY,
      organization_id: 22,
    } as any

    await expect(
      service.create({ job_id: 99, employer_company_id: 8 } as any, actor),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(jobs.findOne).toHaveBeenCalledWith({ where: { id: 99, organization_id: 22 } })
    expect(plans.save).not.toHaveBeenCalled()
  })

  it("scopes an impersonating admin to the entered organization", async () => {
    const plans = repo()

    const service = new CompensationService(
      plans as any,
      repo() as any,
      repo() as any,
      repo() as any,
      repo() as any,
      { log: jest.fn() } as any,
    )

    await service.findAll(
      {
        page: 1,
        limit: 100,
        sort: "created_date",
        order: "DESC",
      } as any,
      {
        id: 1,
        email: "platform-admin@test.local",
        role: UserRole.ADMIN,
        organization_id: 42,
        org_type: "staffing_agency",
        impersonating: true,
      } as any,
    )

    expect(plans.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization_id: 42 }),
      }),
    )
  })

  it("keeps a platform admin unrestricted outside a workspace", async () => {
    const plans = repo()

    const service = new CompensationService(
      plans as any,
      repo() as any,
      repo() as any,
      repo() as any,
      repo() as any,
      { log: jest.fn() } as any,
    )

    await service.findAll(
      {
        page: 1,
        limit: 100,
        sort: "created_date",
        order: "DESC",
      } as any,
      {
        id: 1,
        email: "platform-admin@test.local",
        role: UserRole.ADMIN,
        organization_id: null,
        org_type: null,
        impersonating: false,
      } as any,
    )

    expect(plans.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })
})
