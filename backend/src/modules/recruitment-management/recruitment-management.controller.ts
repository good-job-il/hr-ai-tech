import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AgencyActionPolicyGuard } from '../permissions/agency-action-policy.guard';
import { UserEntity } from '../users/user.entity';
import { AssignRecruitmentWorkDto } from './dto/recruitment-management.dto';
import { RecruitmentManagementService } from './recruitment-management.service';
import { ManagementReportQueryDto } from '../reports/dto/reports.dto';

const MANAGER_ROLES = [UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.ADMIN];

@ApiTags('Recruitment Management')
@ApiBearerAuth()
@Controller('recruitment-management')
export class RecruitmentManagementController {
  constructor(private readonly service: RecruitmentManagementService) {}

  @Get('dashboard')
  @Roles(...MANAGER_ROLES)
  @UseGuards(AgencyActionPolicyGuard)
  @RequiresPermission('view')
  dashboard(@Query() query: ManagementReportQueryDto, @CurrentUser() user: UserEntity) {
    return this.service.dashboard(user, true, query);
  }

  @Post('assign')
  @Roles(...MANAGER_ROLES)
  @UseGuards(AgencyActionPolicyGuard)
  @RequiresPermission('update')
  @HttpCode(HttpStatus.OK)
  assign(@Body() dto: AssignRecruitmentWorkDto, @CurrentUser() user: UserEntity) {
    return this.service.assign(dto, user);
  }
}
