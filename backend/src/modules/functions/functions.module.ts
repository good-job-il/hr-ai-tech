import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidatesModule } from '../candidates/candidates.module';
import { JobsModule } from '../jobs/jobs.module';
import { ApplicationsModule } from '../applications/applications.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { CommunicationModule } from '../communication/communication.module';
import { TaxonomyModule } from '../taxonomy/taxonomy.module';
import { UsersModule } from '../users/users.module';
import { InterviewsModule } from '../interviews/interviews.module';
import { CompaniesModule } from '../companies/companies.module';
import { ImportSourcesModule } from '../import-sources/import-sources.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { CandidateEntity } from '../candidates/entities/candidate.entity';
import { CandidateImportBatchEntity } from '../candidates/entities/candidate-import-batch.entity';
import { CandidateDocumentEntity } from '../candidates/entities/candidate-document.entity';
import { CandidateTimelineEntity } from '../candidates/entities/candidate-timeline.entity';
import { CandidateProfileEntity } from '../candidates/entities/candidate-profile.entity';
import { JobEntity } from '../jobs/entities/job.entity';
import { SavedJobEntity } from '../jobs/entities/saved-job.entity';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { InterviewEntity } from '../interviews/interview.entity';
import { CompanyEntity } from '../companies/company.entity';
import { RoleTaxonomyEntity } from '../taxonomy/entities/role-taxonomy.entity';
import { DomainEntity } from '../taxonomy/entities/domain.entity';
import { RoleAliasEntity } from '../permissions/permissions.entities';
import { ImportSourceEntity } from '../import-sources/import-source.entity';
import { UserEntity } from '../users/user.entity';
import { BackgroundJobEntity } from './entities/background-job.entity';

import { FunctionsMiscService } from './services/functions-misc.service';
import { MatchingService } from './services/matching.service';
import { DashboardService } from './services/dashboard.service';
import { ImportService } from './services/import.service';
import { ResumeExtractionService } from './services/resume-extraction.service';
import { JobCrawlerService } from './services/job-crawler.service';
import { PublicWorkflowController } from './public-workflow.controller';
import { DomainOperationsController } from './domain-operations.controller';
import { BackgroundJobsService } from './services/background-jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateEntity,
      CandidateImportBatchEntity,
      CandidateDocumentEntity,
      CandidateTimelineEntity,
      CandidateProfileEntity,
      JobEntity,
      SavedJobEntity,
      ApplicationEntity,
      InterviewEntity,
      CompanyEntity,
      RoleTaxonomyEntity,
      DomainEntity,
      RoleAliasEntity,
      ImportSourceEntity,
      UserEntity,
      BackgroundJobEntity,
    ]),
    CandidatesModule,
    JobsModule,
    ApplicationsModule,
    NotificationsModule,
    AuditModule,
    CommunicationModule,
    TaxonomyModule,
    UsersModule,
    InterviewsModule,
    CompaniesModule,
    ImportSourcesModule,
    PermissionsModule,
  ],
  controllers: [PublicWorkflowController, DomainOperationsController],
  providers: [
    FunctionsMiscService,
    MatchingService,
    DashboardService,
    ImportService,
    ResumeExtractionService,
    JobCrawlerService,
    BackgroundJobsService,
  ],
})
export class FunctionsModule {}
