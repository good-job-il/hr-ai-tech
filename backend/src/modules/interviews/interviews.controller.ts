import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto, UpdateInterviewDto, QueryInterviewsDto } from './dto/interviews.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ORG_ROLES } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';

/** Only agency staff / employer / admin schedule & manage interviews */
const INTERVIEW_WRITE_ROLES = [UserRole.EMPLOYER, ...ORG_ROLES, UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags('Interviews')
@ApiBearerAuth()
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly svc: InterviewsService) {}

  @Get() findAll(@Query() q: QueryInterviewsDto, @CurrentUser() u: UserEntity) { return this.svc.findAll(q, u); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Post() @Roles(...INTERVIEW_WRITE_ROLES) @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateInterviewDto, @CurrentUser() u: UserEntity) { return this.svc.create(dto, u); }
  @Patch(':id') @Roles(...INTERVIEW_WRITE_ROLES) update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInterviewDto) { return this.svc.update(id, dto); }
  @Delete(':id') @Roles(...INTERVIEW_WRITE_ROLES) @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}

