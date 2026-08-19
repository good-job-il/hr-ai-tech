import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { BillingController } from '../billing/billing.controller';
import { IntegrationConnectionsController } from '../integrations/integration-connections.controller';
import { PermissionMatrixController } from '../permissions/permissions.controller';

const manager = { id: 9, role: 'recruitment_manager', organization_id: 12 };

function contextFor(handler: (...args: any[]) => any): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ user: manager }) }),
  } as unknown as ExecutionContext;
}

describe('RM-4 negative authorization contracts', () => {
  const roles = new RolesGuard(new Reflector());

  it('denies permission matrix mutations to a recruitment manager', () => {
    const handlers = [
      PermissionMatrixController.prototype.create,
      PermissionMatrixController.prototype.update,
      PermissionMatrixController.prototype.remove,
    ];

    handlers.forEach(handler => {
      expect(() => roles.canActivate(contextFor(handler))).toThrow(ForbiddenException);
    });
  });

  it('denies integration mutations to a recruitment manager', () => {
    const handlers = [
      IntegrationConnectionsController.prototype.connect,
      IntegrationConnectionsController.prototype.reconnect,
      IntegrationConnectionsController.prototype.disconnect,
    ];

    handlers.forEach(handler => {
      expect(() => roles.canActivate(contextFor(handler))).toThrow(ForbiddenException);
    });
  });

  it('does not expose a billing mutation endpoint', () => {
    expect(Object.getOwnPropertyNames(BillingController.prototype)).toEqual([
      'constructor',
      'overview',
    ]);
  });
});
