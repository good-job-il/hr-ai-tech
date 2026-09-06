import {
  Body,
  Delete,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Public } from "../../common/decorators/public.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import { UserRole } from "../../common/enums/user-role.enum"
import { UserEntity } from "../users/user.entity"
import { AgencyTeamsService } from "./agency-teams.service"
import {
  AcceptAgencyInvitationDto,
  CreateAgencyTeamDto,
  InviteAgencyMemberDto,
  UpdateAgencyMemberDto,
  UpdateAgencyTeamDto,
} from "./dto/agency-teams.dto"

const READ_ROLES = [
  UserRole.ORG_ADMIN,
  UserRole.RECRUITMENT_MANAGER,
  UserRole.TEAM_MANAGER,
  UserRole.ADMIN,
]

@ApiTags("Agency Teams")
@ApiBearerAuth()
@Controller("agency-teams")
export class AgencyTeamsController {
  constructor(private readonly service: AgencyTeamsService) {}

  @Get()
  @Roles(...READ_ROLES)
  overview(@CurrentUser() user: UserEntity) {
    return this.service.overview(user)
  }

  @Post("teams")
  @Roles(UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createTeam(@Body() dto: CreateAgencyTeamDto, @CurrentUser() user: UserEntity) {
    return this.service.createTeam(dto, user)
  }

  @Patch("teams/:id")
  @Roles(UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.ADMIN)
  updateTeam(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAgencyTeamDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.service.updateTeam(id, dto, user)
  }

  @Delete("teams/:id")
  @Roles(UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTeam(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.service.removeTeam(id, user)
  }

  @Post("invitations")
  @Roles(...READ_ROLES)
  @HttpCode(HttpStatus.CREATED)
  invite(@Body() dto: InviteAgencyMemberDto, @CurrentUser() user: UserEntity) {
    return this.service.invite(dto, user)
  }

  @Post("invitations/:id/resend")
  @Roles(...READ_ROLES)
  resend(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.service.resendInvitation(id, user)
  }

  @Post("invitations/:id/cancel")
  @Roles(...READ_ROLES)
  cancel(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.service.cancelInvitation(id, user)
  }

  @Public()
  @Post("invitations/accept")
  accept(@Body() dto: AcceptAgencyInvitationDto) {
    return this.service.accept(dto.token, dto.password)
  }

  @Delete("members/:id")
  @Roles(...READ_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.service.removeMember(id, user)
  }

  @Patch("members/:id")
  @Roles(...READ_ROLES)
  updateMember(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAgencyMemberDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.service.updateMember(id, dto, user)
  }
}
