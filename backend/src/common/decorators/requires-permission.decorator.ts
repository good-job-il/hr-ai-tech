import { SetMetadata } from "@nestjs/common"
import type { PermissionKey } from "../../modules/permissions/permissions.entities"

export const REQUIRED_PERMISSIONS_KEY = "required_permissions"

export const RequiresPermission = (...permissions: PermissionKey[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions)
