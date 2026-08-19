import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ApplicationEntity } from "./entities/application.entity"
import { ApplicationTimelineEntity } from "./entities/application-timeline.entity"
import { ApplicationsService } from "./applications.service"
import { ApplicationsController } from "./applications.controller"
import { JobEntity } from "../jobs/entities/job.entity"
import { IntegrationsModule } from "../integrations/integrations.module"
import { NotificationsModule } from "../notifications/notifications.module"
import { CandidateEntity } from "../candidates/entities/candidate.entity"
import { UserEntity } from "../users/user.entity"
import { PermissionsModule } from "../permissions/permissions.module"
import { AuditLogEntity } from "../audit/audit-log.entity"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationEntity,
      ApplicationTimelineEntity,
      AuditLogEntity,
      JobEntity,
      CandidateEntity,
      UserEntity,
    ]),
    IntegrationsModule,
    NotificationsModule,
    PermissionsModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService, TypeOrmModule],
})
export class ApplicationsModule {}
