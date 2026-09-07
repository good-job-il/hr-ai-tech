import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { RolesGuard } from "../../auth/guards/roles.guard"
import { BillingController } from "../billing/billing.controller"
import { IntegrationConnectionsController } from "../integrations/integration-connections.controller"
import { PermissionMatrixController } from "../permissions/permissions.controller"

const teamManager = { id: 41, role: "team_manager", organization_id: 12, team_id: 4 }

function contextFor(handler: (...args: any[]) => any): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ user: teamManager }) }),
  } as unknown as ExecutionContext
}

describe("TM-4 negative authorization contracts", () => {
  const roles = new RolesGuard(new Reflector())

  it("denies Permission Matrix list and export to a Team Manager", () => {
    const handlers = [
      PermissionMatrixController.prototype.findAll,
      PermissionMatrixController.prototype.export,
      PermissionMatrixController.prototype.create,
      PermissionMatrixController.prototype.update,
      PermissionMatrixController.prototype.remove,
    ]

    handlers.forEach((handler) => {
      expect(() => roles.canActivate(contextFor(handler))).toThrow(ForbiddenException)
    })
  })

  it("denies organization billing and integrations", () => {
    const handlers = [
      BillingController.prototype.overview,
      IntegrationConnectionsController.prototype.list,
      IntegrationConnectionsController.prototype.connect,
      IntegrationConnectionsController.prototype.reconnect,
      IntegrationConnectionsController.prototype.disconnect,
    ]

    handlers.forEach((handler) => {
      expect(() => roles.canActivate(contextFor(handler))).toThrow(ForbiddenException)
    })
  })

  it("does not expose a billing mutation endpoint", () => {
    expect(Object.getOwnPropertyNames(BillingController.prototype)).toEqual([
      "constructor",
      "overview",
    ])
  })
})
