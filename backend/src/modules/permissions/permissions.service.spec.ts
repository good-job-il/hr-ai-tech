import { ForbiddenException } from "@nestjs/common"
import { UserRole } from "../../common/enums/user-role.enum"
import { PermissionsService } from "./permissions.service"

const repo = () => ({
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn(async (value) => value),
  remove: jest.fn(),
})

const user = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 10,
    email: "admin@tenant.test",
    role: UserRole.ORG_ADMIN,
    organization_id: 7,
    org_type: "staffing_agency",
    impersonating: false,
    ...overrides,
  }) as any

describe("PermissionsService OA-1 boundary", () => {
  let matrixRepo: ReturnType<typeof repo>

  let service: PermissionsService

  beforeEach(() => {
    matrixRepo = repo()
    service = new PermissionsService(
      matrixRepo as any,
      repo() as any,
      repo() as any,
      repo() as any,
      repo() as any,
      { log: jest.fn() } as any,
    )
  })

  it("uses the tenant override before the global template", async () => {
    matrixRepo.findOne
      .mockResolvedValueOnce({ permissions: { manage_users: false, manage_settings: true } })
      .mockResolvedValueOnce({ permissions: { manage_users: true, manage_settings: true } })

    const effective = await service.getEffectivePermissions(user())

    expect(effective.source).toBe("organization")
    expect(effective.permissions.manage_users).toBe(false)
    expect(effective.permissions.manage_settings).toBe(true)
    expect(matrixRepo.findOne).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: 7,
          role_key: UserRole.ORG_ADMIN,
          is_template: false,
        }),
      }),
    )
  })

  it("uses org-admin tenant permissions during an impersonation session", async () => {
    matrixRepo.findOne
      .mockResolvedValueOnce({ permissions: { view: true, view_compensation: true } })
      .mockResolvedValueOnce({ permissions: { manage_settings: true } })

    const effective = await service.getEffectivePermissions(
      user({
        role: UserRole.ADMIN,
        impersonating: true,
      }),
    )

    expect(effective.source).toBe("organization")
    expect(effective.role_key).toBe(UserRole.ORG_ADMIN)
    expect(effective.permissions.view).toBe(true)
    expect(effective.permissions.view_compensation).toBe(true)
    expect(effective.permissions.manage_settings).toBe(false)
    expect(matrixRepo.findOne).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: 7,
          role_key: UserRole.ORG_ADMIN,
          is_template: false,
        }),
      }),
    )
  })

  it("never promotes a recruitment manager into settings administration", async () => {
    matrixRepo.findOne
      .mockResolvedValueOnce({
        permissions: { view: true, manage_users: true, manage_settings: true },
      })
      .mockResolvedValueOnce(null)

    const effective = await service.getEffectivePermissions(
      user({
        role: UserRole.RECRUITMENT_MANAGER,
      }),
    )

    expect(effective.permissions.view).toBe(true)
    expect(effective.permissions.manage_users).toBe(true)
    expect(effective.permissions.manage_settings).toBe(false)
  })

  it("never promotes a team manager into user or settings administration", async () => {
    matrixRepo.findOne
      .mockResolvedValueOnce({
        permissions: { view: true, manage_users: true, manage_settings: true },
      })
      .mockResolvedValueOnce(null)

    const effective = await service.getEffectivePermissions(user({ role: UserRole.TEAM_MANAGER }))

    expect(effective.permissions.view).toBe(true)
    expect(effective.permissions.manage_users).toBe(false)
    expect(effective.permissions.manage_settings).toBe(false)
  })

  it("rejects recruitment manager permission matrix mutations", async () => {
    const manager = user({ role: UserRole.RECRUITMENT_MANAGER })

    matrixRepo.findOne.mockResolvedValue({
      id: 46,
      organization_id: 7,
      is_template: false,
      permissions: { view: true },
    })

    await expect(
      service.createMatrix(
        { role_key: UserRole.RECRUITER, permissions: { view: true } } as any,
        manager,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
    await expect(
      service.updateMatrix(46, { permissions: { view: false } } as any, manager),
    ).rejects.toBeInstanceOf(ForbiddenException)
    await expect(service.removeMatrix(46, manager)).rejects.toBeInstanceOf(ForbiddenException)
    expect(matrixRepo.save).not.toHaveBeenCalled()
    expect(matrixRepo.remove).not.toHaveBeenCalled()
  })

  it("rejects cross-tenant permission matrix updates", async () => {
    matrixRepo.findOne.mockResolvedValue({
      id: 44,
      organization_id: 99,
      is_template: false,
      permissions: { manage_settings: true },
    })

    await expect(
      service.updateMatrix(44, { permissions: { manage_settings: false } } as any, user()),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(matrixRepo.save).not.toHaveBeenCalled()
  })

  it("rejects global template updates from a tenant session", async () => {
    matrixRepo.findOne.mockResolvedValue({
      id: 45,
      organization_id: null,
      is_template: true,
      permissions: { manage_settings: true },
    })

    await expect(
      service.updateMatrix(45, { permissions: { manage_settings: false } } as any, user()),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(matrixRepo.save).not.toHaveBeenCalled()
  })

  it("rejects Team Manager permission matrix list and export", async () => {
    const manager = user({ role: UserRole.TEAM_MANAGER, team_id: 4 })

    await expect(
      service.findMatrices({ page: 1, limit: 50 } as any, manager),
    ).rejects.toBeInstanceOf(ForbiddenException)
    await expect(
      service.exportMatrices({ page: 1, limit: 50 } as any, manager),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(matrixRepo.findAndCount).not.toHaveBeenCalled()
  })

  it("journals a permission matrix export for organization administrators", async () => {
    const audit = { log: jest.fn() }

    matrixRepo.findAndCount.mockResolvedValue([[{ id: 11, role_key: UserRole.RECRUITER }], 1])
    service = new PermissionsService(
      matrixRepo as any,
      repo() as any,
      repo() as any,
      repo() as any,
      repo() as any,
      audit as any,
    )

    const result = await service.exportMatrices({ page: 1, limit: 50 } as any, user())

    expect(result.data).toHaveLength(1)
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "export",
        entity_type: "PermissionMatrix",
        entity_label: "Permission matrix export",
        metadata: expect.objectContaining({ exported_records: 1 }),
      }),
    )
  })
})
