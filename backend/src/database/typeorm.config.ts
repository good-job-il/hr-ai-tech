import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { UserEntity } from '../modules/users/user.entity';
import { OrganizationEntity } from '../modules/organizations/organization.entity';
import { DomainEntity } from '../modules/taxonomy/entities/domain.entity';
import { RoleTaxonomyEntity } from '../modules/taxonomy/entities/role-taxonomy.entity';
import { SpecializationEntity } from '../modules/taxonomy/entities/specialization.entity';
import { WorkModeEntity } from '../modules/taxonomy/entities/work-mode.entity';
import { EmploymentTypeEntity } from '../modules/taxonomy/entities/employment-type.entity';
import { ExperienceLevelEntity } from '../modules/taxonomy/entities/experience-level.entity';
import { CandidateEntity } from '../modules/candidates/entities/candidate.entity';
import { CandidateNoteEntity } from '../modules/candidates/entities/candidate-note.entity';
import { CandidateTagEntity } from '../modules/candidates/entities/candidate-tag.entity';
import { CandidateDocumentEntity } from '../modules/candidates/entities/candidate-document.entity';
import { CandidateTimelineEntity } from '../modules/candidates/entities/candidate-timeline.entity';
import { CandidateImportBatchEntity } from '../modules/candidates/entities/candidate-import-batch.entity';
import { CandidateProfileEntity } from '../modules/candidates/entities/candidate-profile.entity';
import { CandidateAccessEntity } from '../modules/candidates/entities/candidate-access.entity';
import { JobEntity } from '../modules/jobs/entities/job.entity';
import { SavedJobEntity } from '../modules/jobs/entities/saved-job.entity';
import { JobAlertEntity } from '../modules/jobs/entities/job-alert.entity';
import { ApplicationEntity } from '../modules/applications/entities/application.entity';
import { ApplicationTimelineEntity } from '../modules/applications/entities/application-timeline.entity';
import { ApplicationPipelineEntity } from '../modules/applications/entities/application-pipeline.entity';
import { InterviewEntity } from '../modules/interviews/interview.entity';
import { MessageEntity } from '../modules/messages/message.entity';
import { NotificationEntity } from '../modules/notifications/notification.entity';
import { CompanyEntity, CompanyReviewEntity, StaffEntity } from '../modules/companies/company.entity';
import { AuditLogEntity } from '../modules/audit/audit-log.entity';
import { CompensationPlanEntity } from '../modules/compensation/compensation-plan.entity';
import { CommunicationLogEntity, EmployerTimelineEntity } from '../modules/communication/communication-log.entity';
import { ImportSourceEntity } from '../modules/import-sources/import-source.entity';
import { SalaryDataEntity } from '../modules/salary/salary-data.entity';
import {
  PermissionMatrixEntity,
  RoleTemplateEntity,
  RoleAliasEntity,
  UserPositionAccessEntity,
  PositionEntity,
} from '../modules/permissions/permissions.entities';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 3306),
  database: configService.get<string>('DB_NAME', 'hire_israel'),
  username: configService.get<string>('DB_USER', 'hire_user'),
  password: configService.get<string>('DB_PASSWORD', 'hire_pass'),
  charset: 'utf8mb4',
  timezone: 'Z',
  entities: [
    UserEntity,
    OrganizationEntity,
    DomainEntity,
    RoleTaxonomyEntity,
    SpecializationEntity,
    WorkModeEntity,
    EmploymentTypeEntity,
    ExperienceLevelEntity,
    CandidateEntity,
    CandidateNoteEntity,
    CandidateTagEntity,
    CandidateDocumentEntity,
    CandidateTimelineEntity,
    CandidateImportBatchEntity,
    CandidateProfileEntity,
    CandidateAccessEntity,
    JobEntity,
    SavedJobEntity,
    JobAlertEntity,
    ApplicationEntity,
    ApplicationTimelineEntity,
    ApplicationPipelineEntity,
    InterviewEntity,
    MessageEntity,
    NotificationEntity,
    CompanyEntity,
    CompanyReviewEntity,
    StaffEntity,
    AuditLogEntity,
    CompensationPlanEntity,
    CommunicationLogEntity,
    EmployerTimelineEntity,
    ImportSourceEntity,
    SalaryDataEntity,
    PermissionMatrixEntity,
    RoleTemplateEntity,
    RoleAliasEntity,
    UserPositionAccessEntity,
    PositionEntity,
  ],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations_history',
  logging: false,
});

