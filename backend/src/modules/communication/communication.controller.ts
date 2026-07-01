import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import {
  CreateCommunicationLogDto,
  QueryCommunicationLogsDto,
  CreateEmployerTimelineDto,
  QueryEmployerTimelineDto,
} from './dto/communication.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/user.entity';

@ApiTags('Communication')
@ApiBearerAuth()
@Controller('communication-logs')
export class CommunicationController {
  constructor(private readonly svc: CommunicationService) {}

  @Get()
  findAll(@Query() q: QueryCommunicationLogsDto, @CurrentUser() u: UserEntity) {
    return this.svc.findAll(q, u);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCommunicationLogDto, @CurrentUser() u: UserEntity) {
    return this.svc.create(dto, u);
  }
}

@ApiTags('Employer Timeline')
@ApiBearerAuth()
@Controller('employer-timeline')
export class EmployerTimelineController {
  constructor(private readonly svc: CommunicationService) {}

  @Get()
  findAll(@Query() q: QueryEmployerTimelineDto) {
    return this.svc.getEmployerTimeline(q);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEmployerTimelineDto) {
    return this.svc.createEmployerTimelineEvent(dto);
  }
}

