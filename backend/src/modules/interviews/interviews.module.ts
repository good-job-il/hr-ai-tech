import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { InterviewEntity } from "./interview.entity"
import { InterviewsService } from "./interviews.service"
import { InterviewsController } from "./interviews.controller"
import { IntegrationsModule } from "../integrations/integrations.module"
import { ApplicationsModule } from "../applications/applications.module"

@Module({
  imports: [TypeOrmModule.forFeature([InterviewEntity]), IntegrationsModule, ApplicationsModule],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService, TypeOrmModule],
})
export class InterviewsModule {}
