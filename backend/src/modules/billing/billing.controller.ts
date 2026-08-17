import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EffectivePermissionsGuard } from '../permissions/effective-permissions.guard';
import { UserEntity } from '../users/user.entity';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(EffectivePermissionsGuard)
@RequiresPermission('manage_settings')
export class BillingController {
  constructor(private readonly billing: BillingService) {}
  @Get('overview') overview(@CurrentUser() user: UserEntity) { return this.billing.overview(user); }
}
