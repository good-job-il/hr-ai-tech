import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto, UpdateJobDto, QueryJobsDto, CreateSavedJobDto, CreateJobAlertDto, UpdateJobAlertDto } from './dto/jobs.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ORG_ROLES } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';

/** Roles allowed to create/modify job postings (employers & agency staff only) */
const JOB_WRITE_ROLES = [UserRole.EMPLOYER, ...ORG_ROLES, UserRole.ADMIN];

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly svc: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'List jobs (RLS scoped)' })
  findAll(@Query() query: QueryJobsDto, @CurrentUser() user: UserEntity) {
    return this.svc.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.findById(id, user);
  }

  @Post()
  @Roles(...JOB_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create job' })
  create(@Body() dto: CreateJobDto, @CurrentUser() user: UserEntity) {
    return this.svc.create(dto, user);
  }

  @Patch(':id')
  @Roles(...JOB_WRITE_ROLES)
  @ApiOperation({ summary: 'Update job' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...JOB_WRITE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete job' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.softDelete(id, user);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Public()
  @ApiOperation({ summary: 'Increment job view count' })
  incrementViews(@Param('id', ParseIntPipe) id: number) {
    return this.svc.incrementViews(id);
  }

  // ─── Saved Jobs ───────────────────────────────────────────────────────────
  @Get('saved')
  @ApiOperation({ summary: 'Get saved jobs for current user (optionally filtered by job_id)' })
  getSavedJobs(@Query('job_id') jobId: string | undefined, @CurrentUser() user: UserEntity) {
    return this.svc.getSavedJobs(user.email, jobId);
  }

  @Post('saved')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a job' })
  saveJob(@Body() dto: CreateSavedJobDto, @CurrentUser() user: UserEntity) {
    return this.svc.saveJob({ ...dto, user_email: user.email });
  }

  @Delete('saved/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unsave a job' })
  unsaveJob(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.unsaveJob(id, user.email);
  }

  // ─── Job Alerts ───────────────────────────────────────────────────────────
  @Get('alerts')
  getAlerts(@CurrentUser() user: UserEntity) {
    return this.svc.getAlerts(user.email);
  }

  @Post('alerts')
  @HttpCode(HttpStatus.CREATED)
  createAlert(@Body() dto: CreateJobAlertDto, @CurrentUser() user: UserEntity) {
    return this.svc.createAlert({ ...dto, user_email: user.email });
  }

  @Patch('alerts/:id')
  updateAlert(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateJobAlertDto) {
    return this.svc.updateAlert(id, dto);
  }

  @Delete('alerts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAlert(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteAlert(id);
  }
}

