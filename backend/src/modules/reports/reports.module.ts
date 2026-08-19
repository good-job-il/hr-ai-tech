import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ApplicationEntity } from "../applications/entities/application.entity"
import { ApplicationTimelineEntity } from "../applications/entities/application-timeline.entity"
import { CompensationPlanEntity } from "../compensation/compensation-plan.entity"
import { AgencyTeamEntity } from "../agency-teams/agency-team.entity"
import { JobEntity } from "../jobs/entities/job.entity"
import { UserEntity } from "../users/user.entity"
import { ReportsController } from "./reports.controller"
import { ReportsService } from "./reports.service"
import { PermissionsModule } from "../permissions/permissions.module"
import { AuditModule } from "../audit/audit.module"

@Module({
  imports: [
    PermissionsModule,
    AuditModule,
    TypeOrmModule.forFeature([
      ApplicationEntity,
      ApplicationTimelineEntity,
      CompensationPlanEntity,
      AgencyTeamEntity,
      JobEntity,
      UserEntity,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
