import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { JobEntity } from "./entities/job.entity"
import { SavedJobEntity } from "./entities/saved-job.entity"
import { JobAlertEntity } from "./entities/job-alert.entity"
import { JobsService } from "./jobs.service"
import { JobsController, PublicJobsController } from "./jobs.controller"
import { AgencyClientEntity } from "../agency-clients/agency-client.entity"
import { CompanyEntity } from "../companies/company.entity"
import { AuditModule } from "../audit/audit.module"
import { UserEntity } from "../users/user.entity"
import { PermissionsModule } from "../permissions/permissions.module"

@Module({
  imports: [
    AuditModule,
    PermissionsModule,
    TypeOrmModule.forFeature([
      JobEntity,
      SavedJobEntity,
      JobAlertEntity,
      AgencyClientEntity,
      CompanyEntity,
      UserEntity,
    ]),
  ],
  controllers: [JobsController, PublicJobsController],
  providers: [JobsService],
  exports: [JobsService, TypeOrmModule],
})
export class JobsModule {}
