import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgencyClientEntity } from './agency-client.entity';
import { CompanyEntity } from '../companies/company.entity';
import { JobEntity } from '../jobs/entities/job.entity';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { AgencyClientsController } from './agency-clients.controller';
import { AgencyClientsService } from './agency-clients.service';

@Module({
  imports: [TypeOrmModule.forFeature([AgencyClientEntity, CompanyEntity, JobEntity, ApplicationEntity])],
  controllers: [AgencyClientsController],
  providers: [AgencyClientsService],
  exports: [AgencyClientsService],
})
export class AgencyClientsModule {}
