import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { EffectivePermissionsGuard } from '../permissions/effective-permissions.guard';
import { UserEntity } from '../users/user.entity';
import { ConnectIntegrationDto } from './dto/integration.dto';
import { IntegrationConnectionsService } from './integration-connections.service';

@ApiTags('Integration Connections')
@ApiBearerAuth()
@Controller('integration-connections')
export class IntegrationConnectionsController {
  constructor(private readonly integrations: IntegrationConnectionsService) {}

  @Get()
  @Roles(UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.ADMIN)
  list(@CurrentUser() user: UserEntity) { return this.integrations.list(user); }

  @Post(':provider/connect')
  @Roles(UserRole.ORG_ADMIN, UserRole.ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission('manage_settings')
  connect(@Param('provider') provider: string, @Body() dto: ConnectIntegrationDto, @CurrentUser() user: UserEntity) {
    return this.integrations.connect(provider, dto, user);
  }

  @Post(':provider/reconnect')
  @Roles(UserRole.ORG_ADMIN, UserRole.ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission('manage_settings')
  reconnect(@Param('provider') provider: string, @Body() dto: ConnectIntegrationDto, @CurrentUser() user: UserEntity) {
    return this.integrations.reconnect(provider, dto, user);
  }

  @Delete(':provider')
  @Roles(UserRole.ORG_ADMIN, UserRole.ADMIN)
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission('manage_settings')
  disconnect(@Param('provider') provider: string, @CurrentUser() user: UserEntity) {
    return this.integrations.disconnect(provider, user);
  }
}
