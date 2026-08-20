import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, UseGuards } from "@nestjs/common"
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger"
import { AuditService } from "./audit.service"
import { CreateAuditLogDto, QueryAuditLogsDto } from "./dto/audit-log.dto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { UserEntity } from "../users/user.entity"
import { Roles } from "../../common/decorators/roles.decorator"
import { RequiresPermission } from "../../common/decorators/requires-permission.decorator"
import { UserRole } from "../../common/enums/user-role.enum"
import { EffectivePermissionsGuard } from "../permissions/effective-permissions.guard"

const ACTIVITY_ROLES = [
  UserRole.ADMIN,
  UserRole.ORG_ADMIN,
  UserRole.RECRUITMENT_MANAGER,
  UserRole.TEAM_MANAGER,
  UserRole.RECRUITER,
]

const ACTIVITY_EXPORT_ROLES = ACTIVITY_ROLES.filter((role) => role !== UserRole.RECRUITER)

@ApiTags("Audit Log")
@ApiBearerAuth()
@Controller("audit-logs")
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get()
  @Roles(...ACTIVITY_ROLES)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("view")
  findAll(@Query() q: QueryAuditLogsDto, @CurrentUser() u: UserEntity) {
    return this.svc.findAll(q, u)
  }

  @Get("export")
  @Roles(...ACTIVITY_EXPORT_ROLES)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("export")
  export(@Query() q: QueryAuditLogsDto, @CurrentUser() u: UserEntity) {
    return this.svc.export(q, u)
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("update")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAuditLogDto, @CurrentUser() u: UserEntity) {
    return this.svc.create(dto, u)
  }
}
