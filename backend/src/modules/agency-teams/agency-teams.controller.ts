import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';
import { AgencyTeamsService } from './agency-teams.service';
import { AcceptAgencyInvitationDto, CreateAgencyTeamDto, InviteAgencyMemberDto, UpdateAgencyMemberDto, UpdateAgencyTeamDto } from './dto/agency-teams.dto';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { EffectivePermissionsGuard } from '../permissions/effective-permissions.guard';

const READ_ROLES = [UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.ADMIN];

@ApiTags('Agency Teams')
@ApiBearerAuth()
@Controller('agency-teams')
export class AgencyTeamsController {
  constructor(private readonly service: AgencyTeamsService) {}

  @Get() @Roles(...READ_ROLES)
  overview(@CurrentUser() user: UserEntity) { return this.service.overview(user); }

  @Post('teams') @Roles(...READ_ROLES) @UseGuards(EffectivePermissionsGuard) @RequiresPermission('manage_users') @HttpCode(HttpStatus.CREATED)
  createTeam(@Body() dto: CreateAgencyTeamDto, @CurrentUser() user: UserEntity) { return this.service.createTeam(dto, user); }

  @Patch('teams/:id') @Roles(...READ_ROLES) @UseGuards(EffectivePermissionsGuard) @RequiresPermission('manage_users')
  updateTeam(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAgencyTeamDto, @CurrentUser() user: UserEntity) { return this.service.updateTeam(id, dto, user); }

  @Post('invitations') @Roles(UserRole.ORG_ADMIN, UserRole.ADMIN) @UseGuards(EffectivePermissionsGuard) @RequiresPermission('manage_users') @HttpCode(HttpStatus.CREATED)
  invite(@Body() dto: InviteAgencyMemberDto, @CurrentUser() user: UserEntity) { return this.service.invite(dto, user); }

  @Post('invitations/:id/resend') @Roles(UserRole.ORG_ADMIN, UserRole.ADMIN) @UseGuards(EffectivePermissionsGuard) @RequiresPermission('manage_users')
  resend(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) { return this.service.resendInvitation(id, user); }

  @Post('invitations/:id/cancel') @Roles(UserRole.ORG_ADMIN, UserRole.ADMIN) @UseGuards(EffectivePermissionsGuard) @RequiresPermission('manage_users')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) { return this.service.cancelInvitation(id, user); }

  @Public() @Post('invitations/accept')
  accept(@Body() dto: AcceptAgencyInvitationDto) { return this.service.accept(dto.token, dto.password); }

  @Patch('members/:id') @Roles(UserRole.ORG_ADMIN, UserRole.ADMIN) @UseGuards(EffectivePermissionsGuard) @RequiresPermission('manage_users')
  updateMember(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAgencyMemberDto, @CurrentUser() user: UserEntity) { return this.service.updateMember(id, dto, user); }
}
