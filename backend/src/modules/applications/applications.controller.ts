import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger"
import { ApplicationsService } from "./applications.service"
import {
  AddApplicationNoteDto,
  AssignCandidateDto,
  ChangeApplicationStatusDto,
  CreateApplicationDto,
  ReopenApplicationDto,
  SubmitApplicationDto,
  UpdateApplicationDto,
  QueryApplicationsDto,
} from "./dto/applications.dto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import { UserRole, ORG_ROLES } from "../../common/enums/user-role.enum"
import { UserEntity } from "../users/user.entity"
import { AgencyActionPolicyGuard } from "../permissions/agency-action-policy.guard"
import { RequiresPermission } from "../../common/decorators/requires-permission.decorator"

/** Candidates apply for themselves; agency/admin staff can also create on behalf of a candidate */
const APPLICATION_CREATE_ROLES = [UserRole.CANDIDATE, ...ORG_ROLES, UserRole.ADMIN]
/** Only agency staff / employer / admin manage application status & pipeline */
const APPLICATION_MANAGE_ROLES = [UserRole.EMPLOYER, ...ORG_ROLES, UserRole.ADMIN]

@ApiTags("Applications")
@ApiBearerAuth()
@Controller("applications")
@UseGuards(AgencyActionPolicyGuard)
export class ApplicationsController {
  constructor(private readonly svc: ApplicationsService) {}

  @Get() findAll(@Query() q: QueryApplicationsDto, @CurrentUser() u: UserEntity) {
    return this.svc.findAll(q, u)
  }
  @Post("submit")
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: SubmitApplicationDto, @CurrentUser() u: UserEntity) {
    return this.svc.submit(dto, u)
  }
  @Post("assign-candidate")
  @Roles(...APPLICATION_MANAGE_ROLES)
  @RequiresPermission("create")
  @HttpCode(HttpStatus.CREATED)
  assignCandidate(@Body() dto: AssignCandidateDto, @CurrentUser() u: UserEntity) {
    return this.svc.assignCandidate(dto, u)
  }
  @Get(":id") findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() u: UserEntity) {
    return this.svc.findById(id, u)
  }

  @Post()
  @Roles(...APPLICATION_CREATE_ROLES)
  @RequiresPermission("create")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateApplicationDto, @CurrentUser() u: UserEntity) {
    return this.svc.create(dto, u)
  }

  @Patch(":id")
  @Roles(...APPLICATION_MANAGE_ROLES)
  @RequiresPermission("update")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.update(id, dto, u)
  }

  @Patch(":id/status")
  @Roles(...APPLICATION_MANAGE_ROLES)
  @RequiresPermission("update")
  changeStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ChangeApplicationStatusDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.changeStatus(id, dto.status, dto.reason, u)
  }

  @Post(":id/reopen")
  @Roles(...APPLICATION_MANAGE_ROLES)
  @RequiresPermission("update")
  reopen(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReopenApplicationDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.reopen(id, dto.status, dto.reason, u)
  }

  @Post(":id/notes")
  @Roles(...APPLICATION_MANAGE_ROLES)
  @RequiresPermission("update")
  @HttpCode(HttpStatus.CREATED)
  addNote(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AddApplicationNoteDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.addNote(id, dto.content, u)
  }

  @Delete(":id")
  @Roles(...APPLICATION_MANAGE_ROLES)
  @RequiresPermission("delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() u: UserEntity) {
    return this.svc.softDelete(id, u)
  }

  // ─── Timeline ────────────────────────────────────────────────────────────
  @Get(":id/timeline")
  getTimeline(@Param("id", ParseIntPipe) id: number, @CurrentUser() u: UserEntity) {
    return this.svc.getTimeline(id, u)
  }
}
