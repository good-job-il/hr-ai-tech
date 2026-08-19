import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CommunicationLogEntity, EmployerTimelineEntity } from "./communication-log.entity"
import { CommunicationService } from "./communication.service"
import { CommunicationController, EmployerTimelineController } from "./communication.controller"
import { CandidatesModule } from "../candidates/candidates.module"
import { JobsModule } from "../jobs/jobs.module"
import { IntegrationsModule } from "../integrations/integrations.module"
import { PermissionsModule } from "../permissions/permissions.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([CommunicationLogEntity, EmployerTimelineEntity]),
    CandidatesModule,
    JobsModule,
    IntegrationsModule,
    PermissionsModule,
  ],
  controllers: [CommunicationController, EmployerTimelineController],
  providers: [CommunicationService],
  exports: [CommunicationService, TypeOrmModule],
})
export class CommunicationModule {}
