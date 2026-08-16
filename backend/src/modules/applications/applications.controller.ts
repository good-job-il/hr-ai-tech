import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { AssignCandidateDto, ChangeApplicationStatusDto, CreateApplicationDto, SubmitApplicationDto, UpdateApplicationDto, QueryApplicationsDto } from './dto/applications.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ORG_ROLES } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';

/** Candidates apply for themselves; agency/admin staff can also create on behalf of a candidate */
const APPLICATION_CREATE_ROLES = [UserRole.CANDIDATE, ...ORG_ROLES, UserRole.ADMIN];
/** Only agency staff / employer / admin manage application status & pipeline */
const APPLICATION_MANAGE_ROLES = [UserRole.EMPLOYER, ...ORG_ROLES, UserRole.ADMIN];

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly svc: ApplicationsService) {}

  @Get() findAll(@Query() q: QueryApplicationsDto, @CurrentUser() u: UserEntity) { return this.svc.findAll(q, u); }
  @Post('submit')
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: SubmitApplicationDto, @CurrentUser() u: UserEntity) { return this.svc.submit(dto, u); }
  @Post('assign-candidate')
  @Roles(...APPLICATION_MANAGE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  assignCandidate(@Body() dto: AssignCandidateDto, @CurrentUser() u: UserEntity) { return this.svc.assignCandidate(dto, u); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: UserEntity) { return this.svc.findById(id, u); }

  @Post()
  @Roles(...APPLICATION_CREATE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateApplicationDto, @CurrentUser() u: UserEntity) { return this.svc.create(dto, u); }

  @Patch(':id')
  @Roles(...APPLICATION_MANAGE_ROLES)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateApplicationDto, @CurrentUser() u: UserEntity) {
    return this.svc.update(id, dto, u);
  }

  @Patch(':id/status')
  @Roles(...APPLICATION_MANAGE_ROLES)
  changeStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: ChangeApplicationStatusDto, @CurrentUser() u: UserEntity) {
    return this.svc.changeStatus(id, dto.status, u);
  }

  @Delete(':id')
  @Roles(...APPLICATION_MANAGE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: UserEntity) { return this.svc.softDelete(id, u); }

  // ─── Timeline ────────────────────────────────────────────────────────────
  @Get(':id/timeline')
  getTimeline(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: UserEntity) { return this.svc.getTimeline(id, u); }

}
