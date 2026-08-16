import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ORG_ROLES, UserRole } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';
import { CandidatesService } from '../candidates/candidates.service';
import { DashboardService } from './services/dashboard.service';
import { MatchingService } from './services/matching.service';
import { ImportService } from './services/import.service';
import { JobCrawlerService } from './services/job-crawler.service';
import { BackgroundJobsService } from './services/background-jobs.service';
import {
  CreateBulkCandidatesDto,
  ImportResumeFilesDto,
  ParseResumeBatchDto,
  ValidateImportBatchDto,
} from './dto/functions.dto';
import {
  PreviewImportSourceDto,
  QueueCandidateImportDto,
  QueueImportSourceDto,
} from './dto/background-jobs.dto';

const IMPORT_ROLES = [UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.TEAM_MANAGER, UserRole.ADMIN];
const APPLICATION_MANAGE_ROLES = [UserRole.EMPLOYER, ...ORG_ROLES, UserRole.ADMIN];

@ApiTags('Domain operations')
@ApiBearerAuth()
@Controller()
export class DomainOperationsController {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly matching: MatchingService,
    private readonly imports: ImportService,
    private readonly crawler: JobCrawlerService,
    private readonly backgroundJobs: BackgroundJobsService,
    private readonly candidates: CandidatesService,
  ) {}

  @Get('analytics/dashboard')
  @Roles(UserRole.ADMIN)
  dashboardStats() { return this.dashboard.getDashboardStats(); }

  @Post('applications/:id/score')
  @Roles(...APPLICATION_MANAGE_ROLES)
  @HttpCode(HttpStatus.OK)
  scoreApplication(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.matching.scoreApplication(id, user);
  }

  @Post('candidate-imports/batches/:id/run')
  @Roles(...IMPORT_ROLES)
  @HttpCode(HttpStatus.ACCEPTED)
  async queueCandidateImport(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: QueueCandidateImportDto,
    @CurrentUser() user: UserEntity,
  ) {
    await this.candidates.getBatch(id, user);
    await this.candidates.updateBatch(id, { status: 'pending' }, user);
    return this.backgroundJobs.enqueue('candidate_file_import', {
      batch_id: id,
      file_url: dto.file_url,
      file_name: dto.file_name,
    }, dto.idempotency_key, user);
  }

  @Post('candidate-imports/resumes')
  @Roles(...IMPORT_ROLES)
  importResumes(@Body() dto: ImportResumeFilesDto, @CurrentUser() user: UserEntity) {
    return this.imports.importResumeFiles(dto, user);
  }

  @Post('candidate-imports/batches/:id/retry')
  @Roles(...IMPORT_ROLES)
  @HttpCode(HttpStatus.ACCEPTED)
  async retryCandidateImport(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    await this.candidates.getBatch(id, user);
    await this.candidates.updateBatch(id, { status: 'pending' }, user);
    return this.backgroundJobs.retryCandidateBatch(id, user);
  }

  @Post('candidate-imports/resume-batches/parse')
  @Roles(...IMPORT_ROLES)
  parseResumeBatch(@Body() dto: ParseResumeBatchDto, @CurrentUser() user: UserEntity) {
    return this.imports.parseResumeBatch(dto, user);
  }

  @Post('candidate-imports/bulk')
  @Roles(...IMPORT_ROLES)
  createBulkCandidates(@Body() dto: CreateBulkCandidatesDto, @CurrentUser() user: UserEntity) {
    return this.imports.createBulkCandidates(dto, user);
  }

  @Post('candidate-imports/validate')
  @Roles(...IMPORT_ROLES)
  validateBatch(@Body() dto: ValidateImportBatchDto, @CurrentUser() user: UserEntity) {
    return this.imports.validateImportBatch(dto, user);
  }

  @Get('background-jobs/:id')
  @Roles(...IMPORT_ROLES)
  getJob(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.backgroundJobs.findById(id, user);
  }

  @Post('import-sources/:id/runs')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  async queueSourceRun(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: QueueImportSourceDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.backgroundJobs.enqueue('import_source_sync', { source_id: id }, dto.idempotency_key, user);
  }

  @Post('import-sources/preview')
  @Roles(UserRole.ADMIN)
  previewSource(@Body() dto: PreviewImportSourceDto, @CurrentUser() user: UserEntity) {
    return this.crawler.crawlCareerPage({ url: dto.url, company_name: dto.company_name }, user);
  }
}
