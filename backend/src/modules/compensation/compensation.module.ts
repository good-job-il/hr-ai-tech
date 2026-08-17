import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompensationPlanEntity } from './compensation-plan.entity';
import { CompensationService } from './compensation.service';
import { CompensationController } from './compensation.controller';
import { JobEntity } from '../jobs/entities/job.entity';
import { AgencyClientEntity } from '../agency-clients/agency-client.entity';
import { CompanyEntity } from '../companies/company.entity';
import { UserEntity } from '../users/user.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PermissionsModule,
    AuditModule,
    TypeOrmModule.forFeature([CompensationPlanEntity, JobEntity, AgencyClientEntity, CompanyEntity, UserEntity]),
  ],
  controllers: [CompensationController],
  providers: [CompensationService],
  exports: [CompensationService, TypeOrmModule],
})
export class CompensationModule {}
