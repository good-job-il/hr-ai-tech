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
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { UsersService } from "./users.service"
import {
  CreateUserDto,
  InviteOrganizationUserDto,
  UpdateUserDto,
  QueryUsersDto,
} from "./dto/users.dto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import { UserEntity } from "./user.entity"
import { UserRole, ORG_ROLES } from "../../common/enums/user-role.enum"
import { RequiresPermission } from "../../common/decorators/requires-permission.decorator"
import { EffectivePermissionsGuard } from "../permissions/effective-permissions.guard"

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, ...ORG_ROLES)
  @ApiOperation({ summary: "List users (scoped by role/org)" })
  findAll(@Query() query: QueryUsersDto, @CurrentUser() user: UserEntity) {
    return this.usersService.findAll(query, user)
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, ...ORG_ROLES)
  @ApiOperation({ summary: "Get user by ID" })
  findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.usersService.findById(id, user)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create a new user (admin only)" })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: UserEntity) {
    return this.usersService.create(dto, user)
  }

  @Post("invite")
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("manage_users")
  @ApiOperation({ summary: "Invite a user into the current organization" })
  invite(@Body() dto: InviteOrganizationUserDto, @CurrentUser() user: UserEntity) {
    return this.usersService.invite(dto, user)
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("manage_users")
  @ApiOperation({ summary: "Update user" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.usersService.update(id, dto, user)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("manage_users")
  @ApiOperation({ summary: "Delete a user (admin only)" })
  async remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    await this.usersService.remove(id, user)
  }
}
