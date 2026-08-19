import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { InterviewEntity } from "./interview.entity"
import { InterviewsService } from "./interviews.service"
import { InterviewsController } from "./interviews.controller"
import { IntegrationsModule } from "../integrations/integrations.module"
import { ApplicationsModule } from "../applications/applications.module"
import { UserEntity } from "../users/user.entity"
import { PermissionsModule } from "../permissions/permissions.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([InterviewEntity, UserEntity]),
    IntegrationsModule,
    ApplicationsModule,
    PermissionsModule,
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService, TypeOrmModule],
})
export class InterviewsModule {}
