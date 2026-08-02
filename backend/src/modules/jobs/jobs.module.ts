import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from './entities/job.entity';
import { SavedJobEntity } from './entities/saved-job.entity';
import { JobAlertEntity } from './entities/job-alert.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { AgencyClientEntity } from '../agency-clients/agency-client.entity';
import { CompanyEntity } from '../companies/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    JobEntity,
    SavedJobEntity,
    JobAlertEntity,
    AgencyClientEntity,
    CompanyEntity,
  ])],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService, TypeOrmModule],
})
export class JobsModule {}
