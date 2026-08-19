import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PermissionMatrixEntity,
  RoleTemplateEntity,
  RoleAliasEntity,
  UserPositionAccessEntity,
  PositionEntity,
} from './permissions.entities';
import { PermissionsService } from './permissions.service';
import { EffectivePermissionsGuard } from './effective-permissions.guard';
import { AgencyActionPolicyGuard } from './agency-action-policy.guard';
import { AuditModule } from '../audit/audit.module';
import {
  EffectivePermissionsController,
  PermissionMatrixController,
  RoleTemplateController,
  RoleAliasController,
  UserPositionAccessController,
  PositionController,
} from './permissions.controller';

@Module({
  imports: [
    forwardRef(() => AuditModule),
    TypeOrmModule.forFeature([
      PermissionMatrixEntity,
      RoleTemplateEntity,
      RoleAliasEntity,
      UserPositionAccessEntity,
      PositionEntity,
    ]),
  ],
  controllers: [
    EffectivePermissionsController,
    PermissionMatrixController,
    RoleTemplateController,
    RoleAliasController,
    UserPositionAccessController,
    PositionController,
  ],
  providers: [PermissionsService, EffectivePermissionsGuard, AgencyActionPolicyGuard],
  exports: [PermissionsService, EffectivePermissionsGuard, AgencyActionPolicyGuard, TypeOrmModule],
})
export class PermissionsModule {}
