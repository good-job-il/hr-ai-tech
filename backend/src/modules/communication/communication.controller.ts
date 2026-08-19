import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger"
import { CommunicationService } from "./communication.service"
import {
  CreateCommunicationLogDto,
  QueryCommunicationLogsDto,
  CreateEmployerTimelineDto,
  QueryEmployerTimelineDto,
  PresentCandidateDto,
} from "./dto/communication.dto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import { UserRole, ORG_ROLES } from "../../common/enums/user-role.enum"
import { UserEntity } from "../users/user.entity"
import { AgencyActionPolicyGuard } from "../permissions/agency-action-policy.guard"
import { RequiresPermission } from "../../common/decorators/requires-permission.decorator"

/** Internal agency/employer notes — only org staff & admins may write */
const COMMUNICATION_WRITE_ROLES = [...ORG_ROLES, UserRole.ADMIN]

@ApiTags("Communication")
@ApiBearerAuth()
@Controller("communication-logs")
@UseGuards(AgencyActionPolicyGuard)
export class CommunicationController {
  constructor(private readonly svc: CommunicationService) {}

  @Get()
  findAll(@Query() q: QueryCommunicationLogsDto, @CurrentUser() u: UserEntity) {
    return this.svc.findAll(q, u)
  }

  @Post()
  @Roles(...COMMUNICATION_WRITE_ROLES)
  @RequiresPermission("update")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCommunicationLogDto, @CurrentUser() u: UserEntity) {
    return this.svc.create(dto, u)
  }

  @Post("present-candidate")
  @Roles(...COMMUNICATION_WRITE_ROLES)
  @RequiresPermission("update")
  @HttpCode(HttpStatus.CREATED)
  presentCandidate(@Body() dto: PresentCandidateDto, @CurrentUser() u: UserEntity) {
    return this.svc.presentCandidate(dto, u)
  }
}

@ApiTags("Employer Timeline")
@ApiBearerAuth()
@Controller("employer-timeline")
export class EmployerTimelineController {
  constructor(private readonly svc: CommunicationService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() q: QueryEmployerTimelineDto) {
    return this.svc.getEmployerTimeline(q)
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEmployerTimelineDto) {
    return this.svc.createEmployerTimelineEvent(dto)
  }
}
