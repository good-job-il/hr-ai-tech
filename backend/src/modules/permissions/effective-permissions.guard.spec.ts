import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { EffectivePermissionsGuard } from "./effective-permissions.guard"

describe("EffectivePermissionsGuard", () => {
  it("checks the current effective permissions on every mutation", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["manage_users"]),
    } as unknown as Reflector

    const permissionsService = {
      getEffectivePermissions: jest
        .fn()
        .mockResolvedValueOnce({ permissions: { manage_users: true } })
        .mockResolvedValueOnce({ permissions: { manage_users: false } }),
    }

    const guard = new EffectivePermissionsGuard(reflector, permissionsService as any)

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 1 } }) }),
    } as unknown as ExecutionContext

    await expect(guard.canActivate(context)).resolves.toBe(true)
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException)
    expect(permissionsService.getEffectivePermissions).toHaveBeenCalledTimes(2)
  })
})
