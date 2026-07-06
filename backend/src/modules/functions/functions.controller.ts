import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';

import { FunctionsMiscService } from './services/functions-misc.service';
import { MatchingService } from './services/matching.service';
import { DashboardService } from './services/dashboard.service';
import { ImportService } from './services/import.service';
import { ResumeExtractionService } from './services/resume-extraction.service';
import { JobCrawlerService } from './services/job-crawler.service';

import {
  CreateCompanyNotificationDto,
  CreateApplicationTimelineFnDto,
  CreateCandidateTimelineFnDto,
  DeleteCandidateFnDto,
  UpdateCompanyProfileFnDto,
  SendCandidateToEmployerDto,
  GetJobRecommendationsDto,
  ScoreApplicationFnDto,
  SmartSearchDto,
  ExtractResumeFnDto,
  ImportCandidatesFromFileDto,
  CreateBulkCandidatesDto,
  ValidateImportBatchDto,
  ImportResumeFilesDto,
  ParseResumeBatchDto,
  CrawlCareerPageDto,
} from './dto/functions.dto';
import { CreateAuditLogDto } from '../audit/dto/audit-log.dto';

/**
 * FunctionsController — mirrors Base44's `base44.functions.invoke(name, params)`
 * cloud functions as explicit REST endpoints under /api/functions/*.
 *
 * Each route name matches the original Base44 function name 1:1 so the
 * frontend's base44 compatibility shim (Phase 5) can map
 * `functions.invoke('name', params)` → `POST /api/functions/name`.
 */
@ApiTags('Functions')
@ApiBearerAuth()
@Controller('functions')
export class FunctionsController {
  constructor(
    private readonly misc: FunctionsMiscService,
    private readonly matching: MatchingService,
    private readonly dashboard: DashboardService,
    private readonly importService: ImportService,
    private readonly resumeExtraction: ResumeExtractionService,
    private readonly crawler: JobCrawlerService,
  ) {}

  @Post('createCompanyNotification')
  createCompanyNotification(@Body() dto: CreateCompanyNotificationDto) {
    return this.misc.createCompanyNotification(dto);
  }

  @Post('createApplicationTimeline')
  createApplicationTimeline(@Body() dto: CreateApplicationTimelineFnDto, @CurrentUser() user: UserEntity) {
    return this.misc.createApplicationTimeline(dto, user);
  }

  @Post('createCandidateTimeline')
  createCandidateTimeline(@Body() dto: CreateCandidateTimelineFnDto, @CurrentUser() user: UserEntity) {
    return this.misc.createCandidateTimeline(dto, user);
  }

  @Post('createAuditLog')
  createAuditLog(@Body() dto: CreateAuditLogDto) {
    return this.misc.createAuditLog(dto as any);
  }

  @Post('deleteCandidate')
  deleteCandidate(@Body() dto: DeleteCandidateFnDto, @CurrentUser() user: UserEntity) {
    return this.misc.deleteCandidate(dto, user);
  }

  @Post('updateCompanyProfile')
  updateCompanyProfile(@Body() dto: UpdateCompanyProfileFnDto, @CurrentUser() user: UserEntity) {
    return this.misc.updateCompanyProfile(dto, user);
  }

  @Post('sendCandidateToEmployer')
  sendCandidateToEmployer(@Body() dto: SendCandidateToEmployerDto, @CurrentUser() user: UserEntity) {
    return this.misc.sendCandidateToEmployer(dto, user);
  }

  @Post('loadTaxonomy')
  @Roles(UserRole.ADMIN)
  loadTaxonomy() {
    return this.misc.loadTaxonomy();
  }

  @Post('getLocationFromIP')
  @Public()
  getLocationFromIP(@Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.ip;
    return this.misc.getLocationFromIP(ip);
  }

  @Post('getJobRecommendations')
  @Public()
  getJobRecommendations(@Body() dto: GetJobRecommendationsDto) {
    return this.matching.getJobRecommendations(dto);
  }

  @Post('getRecommendedJobs')
  getRecommendedJobs(@CurrentUser() user: UserEntity) {
    return this.matching.getRecommendedJobs(user);
  }

  @Post('scoreApplication')
  scoreApplication(@Body() dto: ScoreApplicationFnDto) {
    return this.matching.scoreApplication(dto);
  }

  @Post('smartSearch')
  @Public()
  smartSearch(@Body() dto: SmartSearchDto) {
    return this.matching.smartSearch(dto);
  }

  @Post('getDashboardStats')
  @Roles(UserRole.ADMIN)
  getDashboardStats() {
    return this.dashboard.getDashboardStats();
  }

  @Post('extractAndTranslateResume')
  extractAndTranslateResume(@Body() dto: ExtractResumeFnDto) {
    return this.resumeExtraction.extractAndTranslate(dto);
  }

  @Post('importCandidatesFromFile')
  importCandidatesFromFile(@Body() dto: ImportCandidatesFromFileDto, @CurrentUser() user: UserEntity) {
    return this.importService.importCandidatesFromFile(dto, user);
  }

  @Post('createBulkCandidates')
  createBulkCandidates(@Body() dto: CreateBulkCandidatesDto, @CurrentUser() user: UserEntity) {
    return this.importService.createBulkCandidates(dto, user);
  }

  @Post('validateImportBatch')
  @Roles(UserRole.ADMIN)
  validateImportBatch(@Body() dto: ValidateImportBatchDto) {
    return this.importService.validateImportBatch(dto);
  }

  @Post('importResumeFiles')
  importResumeFiles(@Body() dto: ImportResumeFilesDto, @CurrentUser() user: UserEntity) {
    return this.importService.importResumeFiles(dto, user);
  }

  @Post('parseResumeBatch')
  parseResumeBatch(@Body() dto: ParseResumeBatchDto, @CurrentUser() user: UserEntity) {
    return this.importService.parseResumeBatch(dto, user);
  }

  @Post('crawlCareerPage')
  @Roles(UserRole.ADMIN)
  crawlCareerPage(@Body() dto: CrawlCareerPageDto, @CurrentUser() user: UserEntity) {
    return this.crawler.crawlCareerPage(dto, user);
  }
}


