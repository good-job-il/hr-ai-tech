import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PermissionMatrixEntity,
  RoleTemplateEntity,
  RoleAliasEntity,
  UserPositionAccessEntity,
  PositionEntity,
} from './permissions.entities';
import { PermissionsService } from './permissions.service';
import {
  PermissionMatrixController,
  RoleTemplateController,
  RoleAliasController,
  UserPositionAccessController,
  PositionController,
} from './permissions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PermissionMatrixEntity,
      RoleTemplateEntity,
      RoleAliasEntity,
      UserPositionAccessEntity,
      PositionEntity,
    ]),
  ],
  controllers: [
    PermissionMatrixController,
    RoleTemplateController,
    RoleAliasController,
    UserPositionAccessController,
    PositionController,
  ],
  providers: [PermissionsService],
  exports: [PermissionsService, TypeOrmModule],
})
export class PermissionsModule {}

