import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, QueryNotificationsDto } from './dto/notifications.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ORG_ROLES } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';

/** Roles allowed to create notifications on behalf of the system/other users */
const NOTIFICATION_CREATE_ROLES = [UserRole.EMPLOYER, ...ORG_ROLES, UserRole.ADMIN];

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  findAll(@Query() q: QueryNotificationsDto, @CurrentUser() u: UserEntity) {
    // Non-admins may only ever see their own notifications, regardless of query override (IDOR fix)
    const isAdmin = u.role === UserRole.ADMIN;
    const recipient_email = isAdmin ? q.recipient_email || u.email : u.email;
    return this.svc.findAll({ ...q, recipient_email });
  }

  @Post() @Roles(...NOTIFICATION_CREATE_ROLES) @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateNotificationDto) { return this.svc.create(dto); }

  @Patch(':id/read') markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: UserEntity) { return this.svc.markRead(id, u); }

  @Patch('read-all') markAllRead(@CurrentUser() u: UserEntity) { return this.svc.markAllRead(u.email); }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: UserEntity) { return this.svc.remove(id, u); }
}

