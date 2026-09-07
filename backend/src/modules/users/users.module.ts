import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { UserEntity } from "./user.entity"
import { UsersService } from "./users.service"
import { IntegrationsModule } from "../integrations/integrations.module"
import { UsersController } from "./users.controller"
import { PermissionsModule } from "../permissions/permissions.module"
import { AuditModule } from "../audit/audit.module"
import { OrganizationEntity } from "../organizations/organization.entity"
import { AgencyTeamEntity } from "../agency-teams/agency-team.entity"

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, OrganizationEntity, AgencyTeamEntity]),
    IntegrationsModule,
    PermissionsModule,
    AuditModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
