import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ApplicationEntity } from "../applications/entities/application.entity"
import { ApplicationTimelineEntity } from "../applications/entities/application-timeline.entity"
import { AgencyTeamEntity } from "../agency-teams/agency-team.entity"
import { AuditLogEntity } from "../audit/audit-log.entity"
import { CandidateEntity } from "../candidates/entities/candidate.entity"
import { JobEntity } from "../jobs/entities/job.entity"
import { NotificationEntity } from "../notifications/notification.entity"
import { NotificationsModule } from "../notifications/notifications.module"
import { PermissionsModule } from "../permissions/permissions.module"
import { UserEntity } from "../users/user.entity"
import { RecruitmentManagementController } from "./recruitment-management.controller"
import { RecruitmentManagementService } from "./recruitment-management.service"

@Module({
  imports: [
    PermissionsModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      ApplicationEntity,
      ApplicationTimelineEntity,
      AgencyTeamEntity,
      AuditLogEntity,
      CandidateEntity,
      JobEntity,
      NotificationEntity,
      UserEntity,
    ]),
  ],
  controllers: [RecruitmentManagementController],
  providers: [RecruitmentManagementService],
  exports: [RecruitmentManagementService],
})
export class RecruitmentManagementModule {}
