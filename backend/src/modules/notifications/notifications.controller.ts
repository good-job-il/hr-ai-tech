import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, QueryNotificationsDto } from './dto/notifications.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/user.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  findAll(@Query() q: QueryNotificationsDto, @CurrentUser() u: UserEntity) {
    // Default to current user's notifications
    return this.svc.findAll({ ...q, recipient_email: q.recipient_email || u.email });
  }

  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateNotificationDto) { return this.svc.create(dto); }

  @Patch(':id/read') markRead(@Param('id', ParseUUIDPipe) id: string) { return this.svc.markRead(id); }

  @Patch('read-all') markAllRead(@CurrentUser() u: UserEntity) { return this.svc.markAllRead(u.email); }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}

