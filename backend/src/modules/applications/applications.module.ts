import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from './entities/application.entity';
import { ApplicationTimelineEntity } from './entities/application-timeline.entity';
import { ApplicationPipelineEntity } from './entities/application-pipeline.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { JobEntity } from '../jobs/entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity, ApplicationTimelineEntity, ApplicationPipelineEntity, JobEntity])],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService, TypeOrmModule],
})
export class ApplicationsModule {}
