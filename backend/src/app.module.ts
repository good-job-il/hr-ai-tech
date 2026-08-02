import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { AuditModule } from './modules/audit/audit.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { CompensationModule } from './modules/compensation/compensation.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ImportSourcesModule } from './modules/import-sources/import-sources.module';
import { SalaryModule } from './modules/salary/salary.module';
import { FunctionsModule } from './modules/functions/functions.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AgencyClientsModule } from './modules/agency-clients/agency-clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    // Phase 1
    AuthModule,
    UsersModule,
    OrganizationsModule,
    TaxonomyModule,
    // Phase 2
    CandidatesModule,
    // Phase 3
    AuditModule,
    CommunicationModule,
    CompensationModule,
    PermissionsModule,
    ImportSourcesModule,
    SalaryModule,
    JobsModule,
    ApplicationsModule,
    InterviewsModule,
    MessagesModule,
    NotificationsModule,
    CompaniesModule,
    AgencyClientsModule,
    // Phase 4
    FunctionsModule,
    // Phase 5
    IntegrationsModule,
  ],
})
export class AppModule {}
