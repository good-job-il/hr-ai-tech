import { Controller, Get, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import { UserRole } from "../../common/enums/user-role.enum"
import { UserEntity } from "../users/user.entity"
import { ManagementReportQueryDto } from "./dto/reports.dto"
import { ReportsService } from "./reports.service"
import { EffectivePermissionsGuard } from "../permissions/effective-permissions.guard"
import { RequiresPermission } from "../../common/decorators/requires-permission.decorator"
import { AuditService } from "../audit/audit.service"

@ApiTags("Management Reports")
@ApiBearerAuth()
@Controller("management-reports")
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Roles(UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.TEAM_MANAGER, UserRole.ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("view")
  getReport(@Query() query: ManagementReportQueryDto, @CurrentUser() user: UserEntity) {
    return this.reports.getManagementReport(query, user)
  }

  @Get("export")
  @Roles(UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.TEAM_MANAGER, UserRole.ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("export")
  async exportReport(@Query() query: ManagementReportQueryDto, @CurrentUser() user: UserEntity) {
    const report = await this.reports.getManagementReport(query, user)

    await this.audit.log({
      organization_id: user.organization_id == null ? null : String(user.organization_id),
      actor_user_id: String(user.id),
      actor_email: user.email,
      actor_role: user.role,
      entity_type: "Organization",
      entity_id: user.organization_id!,
      entity_label: "Management report",
      action: "export",
      metadata: { filters: query },
    })

    return report
  }
}
