import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgencyClientEntity } from './agency-client.entity';
import { CompanyEntity } from '../companies/company.entity';
import { JobEntity } from '../jobs/entities/job.entity';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { AgencyClientsController } from './agency-clients.controller';
import { AgencyClientsService } from './agency-clients.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { UserEntity } from '../users/user.entity';

@Module({
  imports: [PermissionsModule, TypeOrmModule.forFeature([AgencyClientEntity, CompanyEntity, JobEntity, ApplicationEntity, UserEntity])],
  controllers: [AgencyClientsController],
  providers: [AgencyClientsService],
  exports: [AgencyClientsService],
})
export class AgencyClientsModule {}
