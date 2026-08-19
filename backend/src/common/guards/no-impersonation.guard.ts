import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { BLOCK_DURING_IMPERSONATION_KEY } from "../decorators/block-during-impersonation.decorator"

/**
 * Rejects requests to @BlockDuringImpersonation() routes when the current
 * request is authenticated with an admin "workspace" token
 * (req.user.impersonating === true). Register alongside JwtAuthGuard/RolesGuard.
 */
@Injectable()
export class NoImpersonationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isBlocked = this.reflector.getAllAndOverride<boolean>(BLOCK_DURING_IMPERSONATION_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!isBlocked) return true

    const { user } = context.switchToHttp().getRequest()
    if (user?.impersonating) {
      throw new ForbiddenException(
        "This action is not available while inside an organization workspace. Exit the workspace first.",
      )
    }

    return true
  }
}
