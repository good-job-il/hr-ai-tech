import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { REQUIRED_PERMISSIONS_KEY } from "../../common/decorators/requires-permission.decorator"
import { UserEntity } from "../users/user.entity"
import { PermissionKey } from "./permissions.entities"
import { PermissionsService } from "./permissions.service"

@Injectable()
export class EffectivePermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required?.length) return true

    const user = context.switchToHttp().getRequest().user as UserEntity | undefined
    if (!user) throw new ForbiddenException("No user context")

    const effective = await this.permissionsService.getEffectivePermissions(user)
    const missing = required.filter((permission) => !effective.permissions[permission])
    if (missing.length) {
      throw new ForbiddenException(`Missing required permission: ${missing.join(", ")}`)
    }
    return true
  }
}
