import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, ORG_ROLES } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';
import { AgencyClientsService } from './agency-clients.service';
import { CreateAgencyClientDto, QueryAgencyClientsDto, UpdateAgencyClientDto } from './dto/agency-clients.dto';
import { EffectivePermissionsGuard } from '../permissions/effective-permissions.guard';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

const CLIENT_READ_ROLES = [...ORG_ROLES, UserRole.ADMIN];
const CLIENT_WRITE_ROLES = [UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.ADMIN];

@ApiTags('Agency Clients')
@ApiBearerAuth()
@Controller('agency-clients')
export class AgencyClientsController {
  constructor(private readonly service: AgencyClientsService) {}

  @Get()
  @Roles(...CLIENT_READ_ROLES)
  findAll(@Query() query: QueryAgencyClientsDto, @CurrentUser() user: UserEntity) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @Roles(...CLIENT_READ_ROLES)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.service.findById(id, user);
  }

  @Post()
  @Roles(...CLIENT_WRITE_ROLES)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission('create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAgencyClientDto, @CurrentUser() user: UserEntity) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(...CLIENT_WRITE_ROLES)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission('update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAgencyClientDto, @CurrentUser() user: UserEntity) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...CLIENT_WRITE_ROLES)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission('delete')
  @HttpCode(HttpStatus.OK)
  archive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.service.archive(id, user);
  }
}
