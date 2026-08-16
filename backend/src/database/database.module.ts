import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
// Phase 1
import { UserEntity } from '../modules/users/user.entity';
import { OrganizationEntity } from '../modules/organizations/organization.entity';
import { DomainEntity } from '../modules/taxonomy/entities/domain.entity';
import { RoleTaxonomyEntity } from '../modules/taxonomy/entities/role-taxonomy.entity';
import { SpecializationEntity } from '../modules/taxonomy/entities/specialization.entity';
import { WorkModeEntity } from '../modules/taxonomy/entities/work-mode.entity';
import { EmploymentTypeEntity } from '../modules/taxonomy/entities/employment-type.entity';
import { ExperienceLevelEntity } from '../modules/taxonomy/entities/experience-level.entity';
// Phase 2 — Candidates
import { CandidateEntity } from '../modules/candidates/entities/candidate.entity';
import { CandidateNoteEntity } from '../modules/candidates/entities/candidate-note.entity';
import { CandidateTagEntity } from '../modules/candidates/entities/candidate-tag.entity';
import { CandidateDocumentEntity } from '../modules/candidates/entities/candidate-document.entity';
import { CandidateTimelineEntity } from '../modules/candidates/entities/candidate-timeline.entity';
import { CandidateImportBatchEntity } from '../modules/candidates/entities/candidate-import-batch.entity';
import { CandidateProfileEntity } from '../modules/candidates/entities/candidate-profile.entity';
import { CandidateAccessEntity } from '../modules/candidates/entities/candidate-access.entity';
// Phase 2 — Jobs
import { JobEntity } from '../modules/jobs/entities/job.entity';
import { SavedJobEntity } from '../modules/jobs/entities/saved-job.entity';
import { JobAlertEntity } from '../modules/jobs/entities/job-alert.entity';
// Phase 2 — Applications
import { ApplicationEntity } from '../modules/applications/entities/application.entity';
import { ApplicationTimelineEntity } from '../modules/applications/entities/application-timeline.entity';
import { ApplicationPipelineEntity } from '../modules/applications/entities/application-pipeline.entity';
// Phase 2 — Other modules
import { InterviewEntity } from '../modules/interviews/interview.entity';
import { MessageEntity } from '../modules/messages/message.entity';
import { NotificationEntity } from '../modules/notifications/notification.entity';
import { CompanyEntity, CompanyReviewEntity, StaffEntity } from '../modules/companies/company.entity';
import { AgencyClientEntity } from '../modules/agency-clients/agency-client.entity';
import { AgencyTeamEntity } from '../modules/agency-teams/agency-team.entity';
import { AgencyInvitationEntity } from '../modules/agency-teams/agency-invitation.entity';
// Phase 3 — Advanced modules
import { AuditLogEntity } from '../modules/audit/audit-log.entity';
import { CompensationPlanEntity } from '../modules/compensation/compensation-plan.entity';
import { CommunicationLogEntity, EmployerTimelineEntity } from '../modules/communication/communication-log.entity';
import { ImportSourceEntity } from '../modules/import-sources/import-source.entity';
import { BackgroundJobEntity } from '../modules/functions/entities/background-job.entity';
import { SalaryDataEntity } from '../modules/salary/salary-data.entity';
import {
  PermissionMatrixEntity,
  RoleTemplateEntity,
  RoleAliasEntity,
  UserPositionAccessEntity,
  PositionEntity,
} from '../modules/permissions/permissions.entities';

const ALL_ENTITIES = [
  // Phase 1
  UserEntity, OrganizationEntity,
  DomainEntity, RoleTaxonomyEntity, SpecializationEntity,
  WorkModeEntity, EmploymentTypeEntity, ExperienceLevelEntity,
  // Phase 2
  CandidateEntity, CandidateNoteEntity, CandidateTagEntity,
  CandidateDocumentEntity, CandidateTimelineEntity,
  CandidateImportBatchEntity, CandidateProfileEntity, CandidateAccessEntity,
  JobEntity, SavedJobEntity, JobAlertEntity,
  ApplicationEntity, ApplicationTimelineEntity, ApplicationPipelineEntity,
  InterviewEntity, MessageEntity, NotificationEntity,
  CompanyEntity, CompanyReviewEntity, StaffEntity, AgencyClientEntity,
  AgencyTeamEntity, AgencyInvitationEntity,
  // Phase 3
  AuditLogEntity, CompensationPlanEntity,
  CommunicationLogEntity, EmployerTimelineEntity,
  ImportSourceEntity, BackgroundJobEntity, SalaryDataEntity,
  PermissionMatrixEntity, RoleTemplateEntity, RoleAliasEntity,
  UserPositionAccessEntity, PositionEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        database: config.get<string>('DB_NAME', 'hire_israel'),
        username: config.get<string>('DB_USER', 'hire_user'),
        password: config.get<string>('DB_PASSWORD', 'hire_pass'),
        entities: ALL_ENTITIES,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
        charset: 'utf8mb4',
        timezone: 'Z',
        extra: { connectionLimit: 10 },
        migrations: ['dist/migrations/*.js'],
        migrationsRun: false,
        migrationsTableName: 'migrations_history',
      }),
    }),
  ],
})
export class DatabaseModule {}
