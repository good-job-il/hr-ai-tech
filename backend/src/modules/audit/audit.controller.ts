import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CreateAuditLogDto, QueryAuditLogsDto } from './dto/audit-log.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/user.entity';

@ApiTags('Audit Log')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get()
  findAll(@Query() q: QueryAuditLogsDto, @CurrentUser() u: UserEntity) {
    return this.svc.findAll(q, u);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAuditLogDto, @CurrentUser() u: UserEntity) {
    return this.svc.create(dto, u);
  }
}

