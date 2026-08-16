import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { UserEntity } from '../users/user.entity';
import { AgencyInvitationEntity } from './agency-invitation.entity';
import { AgencyTeamEntity } from './agency-team.entity';
import { AgencyTeamsController } from './agency-teams.controller';
import { AgencyTeamsService } from './agency-teams.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AgencyTeamEntity, AgencyInvitationEntity]), AuditModule],
  controllers: [AgencyTeamsController], providers: [AgencyTeamsService], exports: [AgencyTeamsService],
})
export class AgencyTeamsModule {}
