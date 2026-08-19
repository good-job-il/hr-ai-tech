import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { AgencyActionPolicyGuard } from "./agency-action-policy.guard"

const contextFor = (user: Record<string, unknown>) =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext

describe("AgencyActionPolicyGuard RM-1", () => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(["update"]),
  } as unknown as Reflector

  it("enforces the effective action permission for staffing-agency users", async () => {
    const permissions = {
      getEffectivePermissions: jest.fn().mockResolvedValue({ permissions: { update: false } }),
    }

    const guard = new AgencyActionPolicyGuard(reflector, permissions as any)

    await expect(
      guard.canActivate(contextFor({ id: 7, org_type: "staffing_agency" })),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it("does not apply agency policy to an employer workflow", async () => {
    const permissions = { getEffectivePermissions: jest.fn() }

    const guard = new AgencyActionPolicyGuard(reflector, permissions as any)

    await expect(guard.canActivate(contextFor({ id: 8, org_type: "organization" }))).resolves.toBe(
      true,
    )
    expect(permissions.getEffectivePermissions).not.toHaveBeenCalled()
  })
})
