import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger"
import { PermissionsService } from "./permissions.service"
import {
  CreatePermissionMatrixDto,
  UpdatePermissionMatrixDto,
  QueryPermissionMatricesDto,
  CreateRoleTemplateDto,
  UpdateRoleTemplateDto,
  QueryRoleTemplatesDto,
  CreateRoleAliasDto,
  CreateUserPositionAccessDto,
  UpdateUserPositionAccessDto,
  CreatePositionDto,
  UpdatePositionDto,
  QueryPositionsDto,
} from "./dto/permissions.dto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Public } from "../../common/decorators/public.decorator"
import { UserEntity } from "../users/user.entity"
import { Roles } from "../../common/decorators/roles.decorator"
import { UserRole } from "../../common/enums/user-role.enum"
import { RequiresPermission } from "../../common/decorators/requires-permission.decorator"
import { EffectivePermissionsGuard } from "./effective-permissions.guard"

@ApiTags("Effective Permissions")
@ApiBearerAuth()
@Controller("permissions")
export class EffectivePermissionsController {
  constructor(private readonly svc: PermissionsService) {}

  @Get("effective")
  effective(@CurrentUser() user: UserEntity) {
    return this.svc.getEffectivePermissions(user)
  }
}

@ApiTags("Permission Matrix")
@ApiBearerAuth()
@Controller("permission-matrices")
export class PermissionMatrixController {
  constructor(private readonly svc: PermissionsService) {}

  @Get() @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER) findAll(
    @Query() q: QueryPermissionMatricesDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.findMatrices(q, u)
  }
  @Get("export")
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("export")
  export(@Query() q: QueryPermissionMatricesDto, @CurrentUser() u: UserEntity) {
    return this.svc.exportMatrices(q, u)
  }
  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("manage_settings")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePermissionMatrixDto, @CurrentUser() u: UserEntity) {
    return this.svc.createMatrix(dto, u)
  }
  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("manage_settings")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionMatrixDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.updateMatrix(id, dto, u)
  }
  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("manage_settings")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() u: UserEntity) {
    return this.svc.removeMatrix(id, u)
  }
}

@ApiTags("Role Templates")
@ApiBearerAuth()
@Controller("role-templates")
export class RoleTemplateController {
  constructor(private readonly svc: PermissionsService) {}

  @Get() @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER) findAll(
    @Query() q: QueryRoleTemplatesDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.findRoleTemplates(q, u)
  }
  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("manage_settings")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRoleTemplateDto, @CurrentUser() u: UserEntity) {
    return this.svc.createRoleTemplate(dto, u)
  }
  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("manage_settings")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateRoleTemplateDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.updateRoleTemplate(id, dto, u)
  }
  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("manage_settings")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() u: UserEntity) {
    return this.svc.removeRoleTemplate(id, u)
  }
}

@ApiTags("Role Aliases")
@Controller("role-aliases")
export class RoleAliasController {
  constructor(private readonly svc: PermissionsService) {}

  @Get() @Public() findAll() {
    return this.svc.findRoleAliases()
  }
  @Post() @Roles(UserRole.ADMIN) @HttpCode(HttpStatus.CREATED) create(
    @Body() dto: CreateRoleAliasDto,
  ) {
    return this.svc.createRoleAlias(dto)
  }
}

@ApiTags("User Position Access")
@ApiBearerAuth()
@Controller("user-position-access")
export class UserPositionAccessController {
  constructor(private readonly svc: PermissionsService) {}

  @Get() findAll(@Query("company_email") companyEmail: string) {
    return this.svc.findUserPositionAccess(companyEmail)
  }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateUserPositionAccessDto) {
    return this.svc.createUserPositionAccess(dto)
  }
  @Patch(":id") update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserPositionAccessDto,
  ) {
    return this.svc.updateUserPositionAccess(id, dto)
  }
  @Delete(":id") @HttpCode(HttpStatus.NO_CONTENT) remove(@Param("id", ParseIntPipe) id: number) {
    return this.svc.removeUserPositionAccess(id)
  }
}

@ApiTags("Positions")
@ApiBearerAuth()
@Controller("positions")
export class PositionController {
  constructor(private readonly svc: PermissionsService) {}

  @Get() findAll(@Query() q: QueryPositionsDto) {
    return this.svc.findPositions(q)
  }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreatePositionDto) {
    return this.svc.createPosition(dto)
  }
  @Patch(":id") update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePositionDto) {
    return this.svc.updatePosition(id, dto)
  }
  @Delete(":id") @HttpCode(HttpStatus.NO_CONTENT) remove(@Param("id", ParseIntPipe) id: number) {
    return this.svc.removePosition(id)
  }
}
