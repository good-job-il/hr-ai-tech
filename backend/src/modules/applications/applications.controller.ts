import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto, QueryApplicationsDto, CreatePipelineStageDto, UpdatePipelineStageDto } from './dto/applications.dto';
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
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }

  @Post()
  @Roles(...APPLICATION_CREATE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateApplicationDto, @CurrentUser() u: UserEntity) { return this.svc.create(dto, u); }

  @Patch(':id')
  @Roles(...APPLICATION_MANAGE_ROLES)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateApplicationDto, @CurrentUser() u: UserEntity) {
    return this.svc.update(id, dto, u);
  }

  @Delete(':id')
  @Roles(...APPLICATION_MANAGE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: UserEntity) { return this.svc.softDelete(id, u); }

  // ─── Timeline ────────────────────────────────────────────────────────────
  @Get(':id/timeline')
  getTimeline(@Param('id', ParseUUIDPipe) id: string) { return this.svc.getTimeline(id); }

  // ─── Pipeline ────────────────────────────────────────────────────────────
  @Get('pipeline/:employerId')
  @ApiOperation({ summary: 'Get pipeline stages for employer' })
  getPipeline(@Param('employerId') employerId: string) { return this.svc.getPipeline(employerId); }

  @Post('pipeline')
  @Roles(...APPLICATION_MANAGE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  createStage(@Body() dto: CreatePipelineStageDto) { return this.svc.createPipelineStage(dto); }

  @Patch('pipeline/:id')
  @Roles(...APPLICATION_MANAGE_ROLES)
  updateStage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePipelineStageDto) {
    return this.svc.updatePipelineStage(id, dto);
  }

  @Delete('pipeline/:id')
  @Roles(...APPLICATION_MANAGE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteStage(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deletePipelineStage(id); }
}

